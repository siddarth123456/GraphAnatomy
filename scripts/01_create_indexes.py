import neo4j
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

def create_fulltext_indexes():
    driver = neo4j.GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    with driver.session() as session:
        # Create fulltext index for AnatomicalStructure
        try:
            session.run("""
            CREATE FULLTEXT INDEX anatomy_search IF NOT EXISTS 
            FOR (n:AnatomicalStructure) 
            ON EACH [n.name, n.searchableTerms, n.id]
            """)
            print("Fulltext index 'anatomy_search' created/verified.")
        except Exception as e:
            print(f"Error creating anatomy_search index: {e}")
            
        # Create fulltext index for ClinicalCondition
        try:
            session.run("""
            CREATE FULLTEXT INDEX clinical_search IF NOT EXISTS 
            FOR (n:ClinicalCondition) 
            ON EACH [n.name, n.synonyms, n.id]
            """)
            print("Fulltext index 'clinical_search' created/verified.")
        except Exception as e:
            print(f"Error creating clinical_search index: {e}")

    driver.close()

if __name__ == "__main__":
    create_fulltext_indexes()
