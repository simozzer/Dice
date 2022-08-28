pipeline {
    agent { docker { image 'node:18-alpine3.15' } }
      stages {
        stage('log version info') {
      steps {
	sh 'pwd'
        sh 'node --version'
        sh 'npm --version'
	sh 'npm install'
      }
    }
  }
}
