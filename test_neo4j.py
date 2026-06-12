import os
import neo4j
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '.env.local'))
load_dotenv(env_path)

URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

driver = neo4j.GraphDatabase.driver(URI, auth=(USER, PASSWORD))
with driver.session() as session:
    result = session.run("""
    MATCH (n:AnatomicalStructure) 
    WHERE n.graphNodeId IS NULL
    DETACH DELETE n
    RETURN count(n) AS deleted
    """)
    for row in result:
        print(f"Deleted legacy nodes: {row['deleted']}")

driver.close()
