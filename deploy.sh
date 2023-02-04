gcloud functions deploy zummarizefunction \
--gen2 \
--runtime=nodejs18 \
--region=europe-west1 \
--source=functions/ \
--entry-point=zummarizefunction \
--trigger-http \
--allow-unauthenticated