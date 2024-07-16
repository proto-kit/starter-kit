{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {},
    "start": {
      "cache": false
    },
    "migrate": {
      "cache": false
    },
    "prisma:generate": {},
    "start:headless": {}
  }
}
