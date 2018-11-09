#!/bin/bash
pip install pip awscli --upgrade --user
read -e -p "AWS credential profile: " -i "default" AWS_PROFILE
read -e -p "Stack name: " -i "SumerianResourceStack" STACK_NAME
read -e -p "Code name of project (ST/CX/...): " -i "CX" CODENAME
read -e -p "Production name of Sumerian: " -i "MrAiAttendant" PRODNAME
FULL_STACK_NAME="$CODENAME$PRODNAME$STACK_NAME"
aws cloudformation create-stack \
--template-body file://SumerianResourceStack.yaml \
--stack-name $FULL_STACK_NAME \
--parameters ParameterKey=CODENAME,ParameterValue=$CODENAME ParameterKey=PRODNAME,ParameterValue=$PRODNAME \
--capabilities CAPABILITY_IAM  \
--region us-east-1 \
--tags Key=Name,Value=CXHackathonSumerian \
--profile $AWS_PROFILE
aws cloudformation wait stack-create-complete --stack-name $FULL_STACK_NAME --profile $AWS_PROFILE
sleep 1
S3Bucket=$(aws cloudformation describe-stacks --stack-name $FULL_STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`S3Bucket`].OutputValue' --output text --profile $AWS_PROFILE)
aws s3 sync ./resources s3://$S3Bucket --profile $AWS_PROFILE
aws s3 sync ./face s3://$S3Bucket/face --profile $AWS_PROFILE
AWS_PROFILE=$AWS_PROFILE node ./function/app.js $CODENAME $S3Bucket
echo
echo "Now create ExcelLexBot..."
EXCEL_LEX_BOT_SOURCE_BUCKET=$S3Bucket
EXCEL_LEX_BOT_EXCEL_BUCKET="e.$S3Bucket"
aws cloudformation deploy \
--template-file resources/excellexbotplus.yaml \
--stack-name excellexbotplus \
--parameter-overrides  SourceBucket=$EXCEL_LEX_BOT_SOURCE_BUCKET ExcelBucketName=$EXCEL_LEX_BOT_EXCEL_BUCKET DynamodbAutoScaling=false \
--capabilities CAPABILITY_IAM  \
--region us-east-1 \
--tags Key=Name,Value=CXHackathonSumerian \
--profile $AWS_PROFILE
aws s3 sync ./excel s3://$EXCEL_LEX_BOT_EXCEL_BUCKET --profile $AWS_PROFILE