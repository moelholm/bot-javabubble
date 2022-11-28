#!/bin/bash

#
# **** Only used for localdevelopment ****
#

AWS_ACCESS_KEY_ID=id AWS_SECRET_ACCESS_KEY=key AWS_REGION=local aws dynamodb create-table \
             --table-name JavaBubbleAccounts \
             --attribute-definitions \
                 AttributeName=FediverseHandle,AttributeType=S \
             --key-schema \
                 AttributeName=FediverseHandle,KeyType=HASH \
             --provisioned-throughput \
                 ReadCapacityUnits=5,WriteCapacityUnits=5 \
             --table-class STANDARD \
             --endpoint-url http://localhost:8000

AWS_ACCESS_KEY_ID=id AWS_SECRET_ACCESS_KEY=key AWS_REGION=local aws dynamodb update-table \
    --table-name JavaBubbleAccounts \
    --attribute-definitions AttributeName=LastAnnouncedEpoch,AttributeType=S \
    --global-secondary-index-updates \
        "[{\"Create\":{\"IndexName\": \"LastAnnouncedEpoch-index\",\"KeySchema\":[{\"AttributeName\":\"LastAnnouncedEpoch\",\"KeyType\":\"HASH\"}], \
        \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5 },\"Projection\":{\"ProjectionType\":\"ALL\"}}}]"
