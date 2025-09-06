#!/bin/bash

# Script to create a test user in Cognito User Pool
# Usage: ./create-user.sh <USER_POOL_ID> <USERNAME> <EMAIL> <PASSWORD>

if [ $# -ne 4 ]; then
    echo "Usage: $0 <USER_POOL_ID> <USERNAME> <EMAIL> <PASSWORD>"
    echo "Example: $0 us-east-1_ABC123 testuser test@example.com MySecurePass123!"
    exit 1
fi

USER_POOL_ID=$1
USERNAME=$2
EMAIL=$3
PASSWORD=$4

echo "Creating user: $USERNAME with email: $EMAIL"

# Create user with temporary password
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --user-attributes Name=email,Value=$EMAIL \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

if [ $? -eq 0 ]; then
    echo "User created successfully. Setting permanent password..."
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
      --user-pool-id $USER_POOL_ID \
      --username $USERNAME \
      --password $PASSWORD \
      --permanent
    
    if [ $? -eq 0 ]; then
        echo "Password set successfully. User $USERNAME is ready to use."
    else
        echo "Failed to set password."
    fi
else
    echo "Failed to create user."
fi