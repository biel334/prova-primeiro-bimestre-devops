data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  tags = {
    Environment = "prova"
  }
}

module "vpc" {
  source               = "./modules/vpc"
  name                 = var.project_name
  vpc_cidr             = var.vpc_cidr
  azs                  = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags                 = local.tags
}

module "security_group" {
  source = "./modules/security-group"
  name   = var.project_name
  vpc_id = module.vpc.vpc_id
  tags   = local.tags
}

module "rds" {
  source             = "./modules/rds"
  name               = var.project_name
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_group.rds_sg_id
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  tags               = local.tags
}

module "ec2" {
  source            = "./modules/ec2"
  name              = var.project_name
  subnet_id         = module.vpc.public_subnet_ids[0]
  security_group_id = module.security_group.ec2_sg_id
  key_name          = var.key_name
  repo_url          = var.repo_url
  db_host           = module.rds.address
  db_name           = var.db_name
  db_user           = var.db_username
  db_password       = var.db_password
  tags              = local.tags
}
