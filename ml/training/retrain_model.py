import subprocess

print("Starting retraining...........")

subprocess.run(
    [
        "python",
        "-m",
        "ml.training.train_final_model"
    ],
    check=True
)

print("Retraining Completed........")
