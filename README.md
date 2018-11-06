# Sumerian-Concerige-Resource

```bash
.
├── README.md                   <-- This instructions file
├── resources                   <-- The resource for sumerian required
│   └── excellexbotplus.yaml    <-- SAM template of ExcelLexBot
├── SumerianBundle                   
│   └── bundle.zip              <-- The Sumerian exported bundle
├── function                    <-- Nodejs file for create face collection and import DynamoDB data
├── excel                       <-- The Lex bot for Sumerian dialogue component
├── face                        <-- Containe images for indexing face
└── SumerianResourceStack.yaml  <-- SAM template if this stack
```
## Setup process
1. Install [aws-cli](https://github.com/aws/aws-cli) on your local machine.
2. Set up AWS credential profile, please make sure you IAM user have enough permission.
```bash
$ aws configure --profile default
```
3. Upload personal images to 'face' folder.
4. Edit the personal data in 'function/data.json'.
5. Run deploy.sh
6. Modify those parameters, or just keep press enter and skip it.
```bash
$ chmod +x ./deploy.sh
$ ./deploy.sh
```
7. Create a new scene in Sumerian
8. Drag the SumerianBundle/bundle.zip into Sumerian
9. Modify the following item:
   - Change the 'Closeup Camera' to main camera
   - Add the cognito identity pool arn from stack output to scene setting
   - Change the AWS SDK url from stack output to scene setting
   - Change all DynamoDB table name, SNS topic arn and face collection id (CODENAME+FaceCollection) from stack output to MainScript parameters
   - Change the Lex bot name from Lex to MainScript parameters
   - Open text editor, open document 'MicrophoneInput', go row 220, and change the bucket name
10. At the end, publish the scene