# Text-to-Video Provider Adapter Contract

Each T2V provider script must implement the following contract:

## Environment Variables (provided by caller)

| Variable | Description |
|----------|-------------|
| `$PROMPT` | The video generation prompt (English) |
| `$OUTPUT_PATH` | Absolute path where the MP4 file must be written |
| `$DURATION_SEC` | Target video duration in seconds |

## Contract

1. The script receives these three env vars
2. It generates a video clip at `$OUTPUT_PATH` in MP4 format
3. Exit code 0 on success, non-zero on failure
4. Stderr may contain error messages for logging

## Example invocation

```bash
PROMPT="A cinematic shot of..." OUTPUT_PATH="/path/to/output.mp4" DURATION_SEC="8.0" \
  bash t2v-providers/my-provider.sh
```

## Implementing a new provider

1. Copy `stub.sh` as a starting point
2. Replace the body with your actual T2V API call
3. Ensure the output file exists and is a valid MP4 before exiting 0
