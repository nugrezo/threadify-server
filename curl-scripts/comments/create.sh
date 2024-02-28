#!/bin/bash

API="http://localhost:4741"
URL_PATH="/threads"

curl "${API}${URL_PATH}/${ID}/comment" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "comment": {
      "text": "'"${TEXT}"'"
    }
  }'

echo
