// pipeline {
//     agent any
    
//     // Define environment variables used across the pipeline
//     environment {
//         APP_NAME = "my-devops-app"
//         IMAGE_TAG = "${env.BUILD_NUMBER}"
//     }
    
//     stages {
//         stage('Checkout Code') {
//             steps {
//                 echo 'Simulating git checkout... (In a real project, this pulls from GitHub)'
//                 git url: 'https://github.com/abdullahilashik/nestjs-swagger.git', branch: 'master'
//             }
//         }
        
//         stage('Build Artifact / Docker Image') {
//             steps {
//                 echo "Building Docker image: ${env.APP_NAME}:${env.IMAGE_TAG}"
//                 // Because your socket is mounted, this command runs on your host WSL Docker!
//                 sh 'docker --version'
//                 // sh "docker build -t ${env.APP_NAME}:${env.IMAGE_TAG} ."
//             }
//         }
        
//         stage('Run Tests') {
//             steps {
//                 echo 'Running automated tests inside container...'
//                 sh 'echo "Tests passed successfully! 100% coverage."'
//             }
//         }
        
//         stage('Deploy to Staging') {
//             steps {
//                 echo 'Pushing image to registry and deploying to Staging server...'
//                 sh 'echo "Successfully deployed version ${env.IMAGE_TAG} to Staging!"'
//             }
//         }
//     }
    
//     post {
//         always {
//             echo 'Pipeline finished execution.'
//         }
//         success {
//             echo '🎉 Great job! The pipeline completed successfully.'
//         }
//         failure {
//             echo '❌ Oops! Something failed during the pipeline execution.'
//         }
//     }
// }


// second jenkins for Docker CI CD practice

pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('docker-login')
        IMAGE_NAME = 'abdullahilashik/devops'
    }
    
    stages {
        stage('Preperation') {
            steps {
                echo 'Check Docker installation'
                sh 'docker --version'
            }
        }
        
        stage('Checkout') {
            steps {
                echo 'Get the latest code from master'
                git branch: 'master', url: 'https://github.com/abdullahilashik/nestjs-swagger'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:latest .'
            }
        }
        
        stage('Docker Push') {
            steps {
                script {
                    // sh 'echo $DOCKER_CREDENTIALS_PASW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin'
                    // sh 'docker push $IMAGE_NAME:latest'
                    sh 'docker run -itd -p3000:3000 -e NODE_ENV=development -e SWAGGER_ENABLED=true -e SWAGGER_PATH=docs $IMAGE_NAME:latest'
                }
            }
        }
    }
    
    post {
        success {
            emailext subject: '✅ Jenkins CI CD Pipeline successful!',
                    body: 'Image has been successfully built using docker and pushed into docker hub repository',
                    to: 'abdullah.ashik.arefin@gmail.com'
        }
        failure {
            emailext subject: '❌ Failed to  build docker image',
                body: 'Build failed',
                to: 'abdullah.ashik.arefin@gmail.com'
        }
    }
}
