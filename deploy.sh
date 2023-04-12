gcloud functions deploy zummarizefunction \
--gen2 \
--runtime=nodejs18 \
--region=europe-west1 \
--source=functions/ \
--entry-point=zummarizefunction \
--trigger-http \
--allow-unauthenticated \
--env-vars-file .env.yaml \
--memory 4Gi

gcloud functions deploy computearticle \
--gen2 \
--runtime=nodejs18 \
--region=europe-west1 \
--source=functions/ \
--entry-point=computearticle \
--trigger-http \
--allow-unauthenticated \
--env-vars-file .env.yaml \
--memory 4Gi