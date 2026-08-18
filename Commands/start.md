
# Start Commands

**INITILIZE CDC connector**
python scripts/setup_cdc.py

**TRAIN MODEL**if your start new database
python -m ml.training.train_final_model

docker exec -it ml-training  python -m ml.training.train_final_model

**RUN TO UPLOAD DATA TO EXTERNAL DATABASE**
 python kafka_pipeline/producer/db_faker_producer.py
