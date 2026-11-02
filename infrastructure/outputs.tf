output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "monitoring_instance_id" {
  description = "EC2 instance ID for CloudWatch monitoring"
  value       = aws_instance.monitoring_test.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for monitoring alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cpu_alarm_name" {
  description = "CloudWatch CPU alarm name"
  value       = aws_cloudwatch_metric_alarm.ec2_cpu.alarm_name
}