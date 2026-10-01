terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "tfstate-reservas-536615223810"
    key            = "api-reservas/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tflock-reservas"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project = "api-reservas"
      Owner   = "gabriel-6325262"
      Managed = "terraform"
    }
  }
}
