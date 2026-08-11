#!/bin/bash
set -e

echo "🎬 Atlas Demo Video Generator"
echo "=============================="
echo ""

# Check if dev server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ Dev server already running on :3000"
else
    echo "Starting Next.js dev server..."
    npm run dev &
    DEV_PID=$!

    # Wait for server to be ready
    echo "Waiting for server..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo "✓ Server ready"
            break
        fi
        sleep 2
    done
fi

echo ""
echo "Running demo script with video recording..."
npx playwright test tests/demo-video.spec.ts

echo ""
echo "✓ Demo complete!"
echo ""
echo "Video saved to: test-results/*/video.webm"
echo ""

# Find and show the video path
VIDEO_PATH=$(find test-results -name "*.webm" -type f | head -n 1)
if [ -n "$VIDEO_PATH" ]; then
    echo "📹 Video location: $VIDEO_PATH"
    echo ""
    echo "To convert to MP4 (required for YouTube):"
    echo "  ffmpeg -i $VIDEO_PATH demo.mp4"
fi

# Kill dev server if we started it
if [ -n "$DEV_PID" ]; then
    kill $DEV_PID 2>/dev/null || true
fi
