variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "shearly"
}

variable "vpc_cidr" {
  description = "VPC IPv4 CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b"]
}

variable "traffic_weight" {
  description = "Traffic weight for this environment"
  type        = number
  default     = 100

  validation {
    condition     = var.traffic_weight >= 0 && var.traffic_weight <= 255
    error_message = "Traffic weight must be between 0 and 255."
  }
}