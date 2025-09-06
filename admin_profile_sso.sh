#!/bin/bash

# Description:
# SSO ログインした AWS の認証情報をもとに ~/.aws/credentials ファイルを更新する。

set -e -u -o pipefail
echo "Starting script..."

# jq コマンドが必要なので存在確認
if ! command -v jq > /dev/null ; then
  echo "jq command is required." 1>&2
  exit 1
fi
echo "jq command found."

# 事前に SSO ログインしたプロファイルを AWS_PROFILE という名前で設定済みであることを確認
if [ -z "${AWS_PROFILE:+UNDEF}" ]; then
  echo "AWS_PROFILE environment variable must be defined." 1>&2
  exit 1
fi
echo "AWS_PROFILE is set to: ${AWS_PROFILE}"

# SSO のログイン情報を取得
# Add '|| true' to prevent exit on error if a value is not found
echo "Getting SSO configuration..."
SSO_ACCOUNT_ID=$(aws configure get sso_account_id --profile "${AWS_PROFILE}" || true)
echo "SSO_ACCOUNT_ID: ${SSO_ACCOUNT_ID}"
SSO_ROLE_NAME=$(aws configure get sso_role_name --profile "${AWS_PROFILE}" || true)
echo "SSO_ROLE_NAME: ${SSO_ROLE_NAME}"
# SSO_REGION=$(aws configure get sso_region --profile "${AWS_PROFILE}" || true)
# echo "SSO_REGION: ${SSO_REGION}"

echo "Searching for SSO access token..."
SSO_ACCESS_TOKEN=

OIFS="$IFS"
IFS=$'\n'
for file in $(find ~/.aws/sso/cache -type f ! -name "botocore*.json"); do
  # echo "Checking file: ${file}"
  RESULT=$(cat "${file}" | jq -r '.accessToken | select (. != null)')
  if [ ! -z "${RESULT}" ]; then
    # echo "Access token found in ${file}"
    SSO_ACCESS_TOKEN=${RESULT}
    break
  fi
done
IFS="$OIFS"
echo "Finished searching for token."

if [ -z "${SSO_ACCOUNT_ID}" ]; then
  echo "Invalid SSO_ACCOUNT_ID. Please check your AWS config for profile '${AWS_PROFILE}'." 1>&2
  exit 1
fi

if [ -z "${SSO_ROLE_NAME}" ]; then
  echo "Invalid SSO_ROLE_NAME. Please check your AWS config for profile '${AWS_PROFILE}'." 1>&2
  exit 1
fi

# if [ -z "${SSO_REGION}" ]; then
#   echo "Invalid SSO_REGION. Please check your AWS config for profile '${AWS_PROFILE}'." 1>&2
#   exit 1
# fi

if [ -z "${SSO_ACCESS_TOKEN}" ]; then
  echo "Invalid SSO_ACCESS_TOKEN: Could not find access token in ~/.aws/sso/cache. Please run 'aws sso login' again." 1>&2
  exit 1
fi
echo "SSO_ACCESS_TOKEN found."

# ログイン情報を取得
echo "Getting role credentials..."
CREDENTIALS=$(aws sso get-role-credentials \
  --account-id "${SSO_ACCOUNT_ID}" \
  --role-name "${SSO_ROLE_NAME}" \
  --access-token "${SSO_ACCESS_TOKEN}" \
  --profile "${AWS_PROFILE}"
  )

echo "Credentials received. Parsing..."
AWS_ACCESS_KEY_ID=$(echo "${CREDENTIALS}" | jq -r '.roleCredentials.accessKeyId')
AWS_SECRET_ACCESS_KEY=$(echo "${CREDENTIALS}" | jq -r '.roleCredentials.secretAccessKey')
AWS_SESSION_TOKEN=$(echo "${CREDENTIALS}" | jq -r '.roleCredentials.sessionToken')

echo "Updating ~/.aws/credentials..."
# ~/.aws/credentials ファイルへ反映
aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}" --profile "${AWS_PROFILE}"
aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}" --profile "${AWS_PROFILE}"
aws configure set aws_session_token "${AWS_SESSION_TOKEN}" --profile "${AWS_PROFILE}"

echo "Finished successfully."
