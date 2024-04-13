API="http://localhost:4741"
URL_PATH="/change-username"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
--header "Authorization: Bearer ${TOKEN}" \
--data '{
    "username": "'"${NEWUSERNAME}"'"
  }'

echo
