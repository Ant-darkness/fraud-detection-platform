CREATE TADABASE 
```docker exec -it sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Fraud@2026" -C```

ENTER KAFKA BASH
`docker exec -it kafka bash`

TEST IF KAFKA PRODUCER USES TOPICS
```kafka-console-consumer --topic transactions --from-beginning --bootstrap-server localhost:9092```

PRODUCER 
`docker exec -it kafka kafka-console-producer  --bootstrap-server localhost:9092 --topic transactions`

TEST IF PRODUCER USES TOPIC
`kafka-console-consumer --topic transactions --from-beginning --bootstrap-server localhost:9092`

CONSUMER
` docker exec -it kafka kafka-console-consumer  --bootstrap-server localhost:9092 --topic transactions --from-beginning`

CREATE TOPIC
`docker exec -it kafka kafka-topics --create --topic transactions --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1`

CHECK TOPICS
`docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092`

DELETE TOPIC
`docker exec -it kafka kafka-topics --delete --topic transactions --bootstrap-server localhost:9092`

ENTERE SQL SERVER SHELL
`docker exec -it sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Fraud@2026" -C`

TO CHECK LOGS
`docker logs sqlserver(container) --tail 50`

TO CHECK IF TOPIC HAS A DATA
`docker exec -it kafka kafka-run-class kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic transactions`

TO BUILD CONTAINER
`docker compose build fraud-api`

CHECK VOLUME
`docker volume ls`

DELETE VOLUME
`docker volume rm fraud-detection-platform_sqlserver_data`

TO GET PASSWORD AND USERNAME FOR AIRFLOW LOGIN WEB
`docker logs airflow-webserver --tail 50`

TO CHECK THE CREATED DAGS
`docker exec -it airflow-webserver airflow dags reserialize`
        THEN
`docker exec -it airflow-webserver airflow dags list`




