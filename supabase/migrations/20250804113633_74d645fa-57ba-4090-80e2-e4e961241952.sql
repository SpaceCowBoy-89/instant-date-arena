-- Add foreign key constraint between user_compatibility_scores and users tables
ALTER TABLE user_compatibility_scores 
ADD CONSTRAINT fk_user_compatibility_scores_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE CASCADE;