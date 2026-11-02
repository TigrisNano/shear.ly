variable "project_name" {
  description = "Project name"
  type        = string
  default     = "shearly"
}

variable "environment" {
  description = "Deployment environment: active or standby"
  type        = string

  validation {
    condition     = contains(["active", "standby"], var.environment)
    error_message = "Environment must be active or standby."
  }
}

variable "app_version" {
  description = "Application version"
  type        = string
  default     = "v1"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
  default     = "8IZ8BWY1L325SEP2X2XI1I"
}

variable "app_endpoint" {
  description = "Application endpoint for DNS routing"
  type        = string
}
variable "traffic_weight" {
  description = "Traffic weight for this environment"
  type        = number

  validation {
    condition     = var.traffic_weight >= 0 && var.traffic_weight <= 255
    error_message = "Traffic weight must be between 0 and 255."
  }
}
