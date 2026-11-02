resource "aws_route53_record" "app" {
  zone_id = var.hosted_zone_id
  name    = "app.shearly.local"
  type    = "A"
  ttl     = 60

  set_identifier = var.environment

  weighted_routing_policy {
    weight = var.traffic_weight
  }

  records = [var.app_endpoint]
}

output "environment" {
  value = var.environment
}

output "app_version" {
  value = var.app_version
}

output "dns_name" {
  value = aws_route53_record.app.fqdn
}

output "traffic_weight" {
  value = var.traffic_weight
}