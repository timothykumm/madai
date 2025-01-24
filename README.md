# MAD-AI

Project for my Bachelor's Thesis: Multi-Agent Debate with LLMs

## Overview

The **MAD-AI** project explores the use of Large Language Models (LLMs) to create a Multi-Agent System (MAS) where multiple agents discuss and analyze provided source code. This system simulates a structured debate to improve decision-making and insights into software analysis.

## Features

-   Multiple AI agents with distinct roles (e.g., Debaters and Judges)
-   Configurable rounds and evaluation criteria
-   JSON-formatted output with confidence levels

## Example cURL Request

Below is an example of how to use the API endpoint to initiate a Multi-Agent Debate:

```bash
curl.exe -X POST http://localhost:3000/api/mad \
    -F "code=@C:\Users\xy\code.zip" \
    -F "configuration={ \"apiKeys\": { \"google\": \"REPLACE\", \"openAi\": \"REPLACE\" }, \"agents\": [ { \"name\": \"AgentA\", \"model\": \"gemini-1.5-flash\", \"role\": \"assistant\", \"systemInstruction\": \"Du bist ein Experte in der Softwareentwicklung und wirst nacheinander Quellcode eines Projektes zugespielt bekommen, welchen du auf Kriterien untersuchst. Formatiere den Output als JSON wie folgt: { output: string, foundCriteriasCount: number, confidence: 'LOW' ^| 'MEDIUM' ^| 'HIGH' }.\", \"type\": \"Debater\" }, { \"name\": \"AgentB\", \"model\": \"gemini-1.5-flash\", \"role\": \"assistant\", \"systemInstruction\": \"Du bist ein Experte in der Softwareentwicklung und wirst nacheinander Quellcode eines Projektes zugespielt bekommen, welchen du auf Kriterien untersuchst. Formatiere den Output als JSON wie folgt: { output: string, foundCriteriasCount: number, confidence: 'LOW' ^| 'MEDIUM' ^| 'HIGH' }.\", \"type\": \"Debater\" }, { \"name\": \"AgentC\", \"model\": \"gemini-1.5-flash\", \"role\": \"assistant\", \"systemInstruction\": \"Du bist ein Experte in der Softwareentwicklung und wirst nacheinander Quellcode eines Projektes zugespielt bekommen, welchen du auf Kriterien untersuchst. Formatiere den Output als JSON wie folgt: { output: string, foundCriteriasCount: number, confidence: 'LOW' ^| 'MEDIUM' ^| 'HIGH' }.\", \"type\": \"Judge\" } ], \"rounds\": 3, \"dynamicRounds\": true, \"task\": \"Untersuche den Code auf Fairness\" }" \
    --no-buffer
```

### Explanation

1. **Endpoint:** `http://localhost:3000/api/mad`
2. **File Upload:** `-F "code=@C:\Users\xy\code.zip"`
    - Replace `C:\Users\xy\code.zip` with the path to your source code.
3. **Configuration:**
    - `apiKeys`: Replace `google` and `openAi` placeholders with your API keys.
    - `agents`: Define agents with their roles, models, and instructions.
    - `rounds`: Specify the number of debate rounds.
    - `dynamicRounds`: If true, the debate will end earlier if the confidence is high.
    - `task`: Defines the task for the software engineers.

## Output Format

Agents analyze the source code and produce JSON-formatted outputs:

```json
{
    "output": "Analysis summary",
    "foundCriteriasCount": 5,
    "confidence": "HIGH"
}
```

-   `output`: Summary of the agent's analysis
-   `foundCriteriasCount`: Number of criteria found in the code
-   `confidence`: Confidence level of the analysis (`LOW`, `MEDIUM`, `HIGH`)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-repo/mad-ai.git
    ```
2. Navigate to the project directory:
    ```bash
    cd mad-ai
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Start the server:
    ```bash
    npm run dev
    ```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
