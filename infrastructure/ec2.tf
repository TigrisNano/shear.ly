resource "aws_instance" "monitoring_test" {
  ami                    = "ami-04681a1dbd79675a5"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.app.id]

  tags = {
    Name = "${var.project_name}-monitoring-test"
  }
}