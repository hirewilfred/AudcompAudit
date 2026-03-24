#!/usr/bin/env python3
"""
Imagen - Google Gemini Image Generation Script
Usage: python generate_image.py "prompt" [output_path]
"""

import argparse
import base64
import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

DEFAULT_MODEL_ID = "imagen-4.0-generate-001"
API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
DEFAULT_IMAGE_SIZE = "1K"

def get_api_endpoint(model_id):
    if model_id.startswith("imagen"):
        return f"{API_BASE_URL}/{model_id}:predict"
    return f"{API_BASE_URL}/{model_id}:generateContent"

def get_api_key():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)
    return api_key

def build_request_body(prompt, image_size, model_id):
    if model_id.startswith("imagen"):
        return json.dumps({
            "instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1, "aspectRatio": "16:9"}
        }).encode("utf-8")
    return json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
            "imageConfig": {"image_size": image_size}
        }
    }).encode("utf-8")

def make_api_request(api_key, model_id, request_body):
    url = f"{get_api_endpoint(model_id)}?key={api_key}"
    req = urllib.request.Request(url, data=request_body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        print(f"Error: API request failed with HTTP {e.code}", file=sys.stderr)
        if error_body:
            print(error_body, file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Error: Connection failed: {e.reason}", file=sys.stderr)
        sys.exit(1)

def extract_image_data(response, model_id):
    try:
        # Imagen models return predictions array
        if model_id.startswith("imagen"):
            predictions = response.get("predictions", [])
            if predictions:
                return predictions[0].get("bytesBase64Encoded", "")
            raise ValueError("No predictions in response")
        # Gemini models return candidates
        if isinstance(response, list):
            candidates = response[0].get("candidates", [])
        else:
            candidates = response.get("candidates", [])
        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            if "inlineData" in part:
                return part["inlineData"].get("data", "")
        raise ValueError("No image data found")
    except (KeyError, IndexError, TypeError) as e:
        print(f"Error parsing response: {e}", file=sys.stderr)
        print(json.dumps(response, indent=2), file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Generate images using Google Gemini AI")
    parser.add_argument("prompt", help="Text description of the image to generate")
    parser.add_argument("output", nargs="?", default="./generated-image.png", help="Output file path")
    parser.add_argument("--size", choices=["512", "1K", "2K"], default=None)
    parser.add_argument("--model", "-m", default=None)
    args = parser.parse_args()

    api_key = get_api_key()
    model_id = args.model or os.environ.get("GEMINI_MODEL", DEFAULT_MODEL_ID)
    image_size = args.size or os.environ.get("IMAGE_SIZE", DEFAULT_IMAGE_SIZE)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating: \"{args.prompt}\"")
    print(f"Model: {model_id} | Size: {image_size}")

    request_body = build_request_body(args.prompt, image_size, model_id)
    response = make_api_request(api_key, model_id, request_body)
    image_data = extract_image_data(response, model_id)

    if not image_data:
        print("Error: No image data received", file=sys.stderr)
        sys.exit(1)

    output_path.write_bytes(base64.b64decode(image_data))
    size_kb = output_path.stat().st_size / 1024
    print(f"Saved: {output_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
