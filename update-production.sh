#! /bin/bash

ssh -i ~/.ssh/keys/aws-marcuschiu.pem ec2-user@www.marcuschiu.com << EOF
  rm -rf fisher-information/
  git clone https://github.com/TheRealMarcusChiu/fisher-information.git
  rm -rf fisher-information/.git
  rm -rf fisher-information/update-production.sh
  rm -rf fisher-information/.gitignore
EOF