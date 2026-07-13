from backend.ml.extract_training_data import (
    extract_training_data, OUTPUT_PATH
)

from ml.training.train_final_model import (
    main as train_model
)


def main():

    #print("=" * 60)
    #print("STEP 1 : EXTRACT TRAINING DATA")
    #print("=" * 60)

    #extract_training_data()

    #print("=" * 60)
    #print("STEP 2 : TRAIN MODEL")
    #print("=" * 60)

    train_model(DATA_PATH=OUTPUT_PATH)

    print("=" * 60)
    print("RETRAINING COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()
