
p
pipeline {
    agent any

    stages {
        stage('Checkout GitHub') {
            steps {
                echo 'GitHub source code connected successfully'
            }
        }

        stage('Verify Build Environment') {
            steps {
                sh 'mvn -version'
                sh 'docker --version'
                echo 'Build environment verified successfully'
            }
        }

        stage('Maven Build') {
            steps {
                sh 'mvn clean package'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t classroom-issue-reporting:latest .'
            }
        }
    }

    post {
        success {
            echo 'Classroom Issue Reporting CI/CD Successful!'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}
