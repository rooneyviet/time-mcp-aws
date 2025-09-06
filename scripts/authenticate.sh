#!/bin/bash

# AWS Cognito Authentication Script
# 
# Usage: ./authenticate.sh
# 
# This script will prompt you for the following inputs:
# - User Pool ID (e.g., us-east-1_gVPqDuZnV)
# - Client ID (e.g., 6bmd6map6i9vfgsj38fdmm4k5c)  
# - AWS Region (e.g., us-east-1)
# - Username
# - Password
#
# The script will then authenticate with AWS Cognito using the provided credentials.

# Prompt for User Pool ID
read -p "Enter User Pool ID: " USER_POOL_ID
if [ -z "$USER_POOL_ID" ]; then
    echo "Error: User Pool ID is required"
    exit 1
fi

# Prompt for Client ID
read -p "Enter Client ID: " CLIENT_ID
if [ -z "$CLIENT_ID" ]; then
    echo "Error: Client ID is required"
    exit 1
fi

# Prompt for Region
read -p "Enter AWS Region [us-east-1]: " REGION
REGION=${REGION:-us-east-1}

# Prompt for Username
read -p "Enter Username: " USERNAME
if [ -z "$USERNAME" ]; then
    echo "Error: Username is required"
    exit 1
fi

# Prompt for Password
read -p "Enter Password: " PASSWORD
if [ -z "$PASSWORD" ]; then
    echo "Error: Password is required"
    exit 1
fi

echo "Authenticating with AWS Cognito..."

aws cognito-idp admin-initiate-auth \
  --user-pool-id $USER_POOL_ID \
  --region $REGION \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=$USERNAME,PASSWORD=$PASSWORD
