MODEL_REGISTRY TABLE

```MS
CREATE TABLE model_registry (
    model_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version INT NOT NULL,
    model_path VARCHAR(500) NOT NULL,
    dataset_size BIGINT,
    precision_score FLOAT,
    recall_score FLOAT,
    f1_score FLOAT,
    roc_auc FLOAT,
    is_active BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE());
```
