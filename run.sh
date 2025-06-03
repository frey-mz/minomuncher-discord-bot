while true; do
  echo "Starting your command..."
  bun run . 
  echo "Command exited with code $? — restarting in 5 seconds..."
  sleep 5
done

