variable "region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "reservas"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "db_name" {
  type    = string
  default = "reservas"
}

variable "db_username" {
  type    = string
  default = "reservas_admin"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "repo_url" {
  type    = string
  default = "https://github.com/biel334/prova-primeiro-bimestre-devops.git"
}

variable "key_name" {
  type    = string
  default = null
}
