from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import json
import glob


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# N8N Workflow Models
class WorkflowNode(BaseModel):
    name: str
    type: str
    parameters: Dict[str, Any] = {}
    position: List[int] = []

class N8NWorkflow(BaseModel):
    id: int
    filename: str
    title: str
    description: str
    active: bool
    nodes: int
    node_types: List[str]
    content: Dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

@api_router.get("/workflows", response_model=List[N8NWorkflow])
async def get_workflows():
    """
    Dynamically load and return all N8N workflow JSON files from the n8n_workflows folder
    """
    try:
        workflows = []
        workflows_dir = Path("/app/n8n_workflows")
        
        # Check if directory exists
        if not workflows_dir.exists():
            logger.warning(f"n8n_workflows directory not found at {workflows_dir}")
            return []
        
        # Find all JSON files in the directory
        json_files = glob.glob(str(workflows_dir / "*.json"))
        
        if not json_files:
            logger.info("No JSON files found in n8n_workflows directory")
            return []
        
        for idx, json_file in enumerate(json_files, 1):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    workflow_data = json.load(f)
                
                # Extract filename without extension
                filename = os.path.basename(json_file)
                title = workflow_data.get('name', filename.replace('.json', '').replace('_', ' ').title())
                
                # Extract node information
                nodes = workflow_data.get('nodes', [])
                node_count = len(nodes)
                node_types = []
                
                # Extract node types for description
                for node in nodes:
                    node_type = node.get('type', '').split('.')[-1] if node.get('type') else 'Unknown'
                    if node_type not in node_types:
                        node_types.append(node_type)
                
                # Generate description based on node types
                description = f"Workflow with {node_count} nodes"
                if node_types:
                    main_types = [t for t in node_types if t not in ['scheduleTrigger', 'webhook']]
                    if main_types:
                        description += f" including {', '.join(main_types[:3])}"
                    if len(main_types) > 3:
                        description += f" and {len(main_types) - 3} more"
                
                # Determine if workflow is active
                active = workflow_data.get('active', True)
                
                # Extract timestamps
                created_at = workflow_data.get('createdAt')
                updated_at = workflow_data.get('updatedAt')
                
                workflow = N8NWorkflow(
                    id=idx,
                    filename=filename,
                    title=title,
                    description=description,
                    active=active,
                    nodes=node_count,
                    node_types=node_types,
                    content=workflow_data,
                    created_at=created_at,
                    updated_at=updated_at
                )
                
                workflows.append(workflow)
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON file {json_file}: {e}")
                continue
            except Exception as e:
                logger.error(f"Error processing file {json_file}: {e}")
                continue
        
        logger.info(f"Successfully loaded {len(workflows)} workflows from n8n_workflows directory")
        return workflows
        
    except Exception as e:
        logger.error(f"Error loading workflows: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading workflows: {str(e)}")

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
