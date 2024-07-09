document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const resultsContainer = document.querySelector('#results');

  form.addEventListener('submit', async (e) => {
    try {
      // Prevent the form from submitting
      e.preventDefault();
      // Get the values of the prompt and stream inputs
      const {
        promptArea: { value: promptValue },
        stream: { checked: streamValue },
        submit,
      } = form.elements;

      resultsContainer.innerHTML = '';

      stream.disabled = true;
      promptArea.disabled = true;
      submit.disabled = true;

      submit.classList.add(
        'bg-gray-500',
        'hover:bg-gray-500',
        'cursor-not-allowed'
      );

      if (!promptValue) return alert('Please enter a prompt');

      const response = await fetch(
        'http://localhost:5050/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            mode: 'development', // Set the mode to development to not send the request to Open AI for now
            provider: 'open-ai',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            stream: streamValue,
            messages: [
              {
                role: 'system',
                content:
                  'You are a software developer student that only speaks in rhymes', // This is the system message, it will control the behavior of the chatbot
              },
              {
                role: 'user',
                content: promptValue, // This is the user message, it will be the prompt for the chatbot
              },
            ],
          }),
        }
      );

      if (streamValue) {
        const reader = response.body.getReader();
        // Create a new TextDecoder
        const decoder = new TextDecoder('utf-8');
        // Read the stream
        let result = false;
        let dataResult = '';
        const p = document.createElement('p');
        resultsContainer.appendChild(p);

        // While the stream is not closed, i.e. done is false
        while (!(result = await reader.read()).done) {
          // Decode the result
          const chunk = decoder.decode(result.value, { stream: true });
          // Split lines by new line
          const lines = chunk.split('\\n');
          // Loop through each line
          lines.forEach((line) => {
            // Check if the line starts with data:
            if (line.startsWith('data:')) {
              // Get the JSON string without the data: prefix

              const jsonStr = line.replace('data:', '');

              // Parse the JSON string
              const data = JSON.parse(jsonStr);
              // Get the content from the first choice

              const content = data.choices[0]?.delta?.content;
              // If there is content
              if (content) {
                // Add the content to the dataResult
                dataResult += content;
                const md = marked.parse(dataResult);
                // Add the content to the paragraph element;
                p.innerHTML = md;
                Prism.highlightAll();
              }
            }
          });
        }
      } else {
        // Process response normally
        const data = await response.json();
        resultsContainer.innerHTML = `<p>${marked.parse(
          data.message?.content
        )}</p>`;
        Prism.highlightAll();
      }
    } catch (error) {
      // If an error occurs, log it to the console
      console.error(error);
    } finally {
      stream.disabled = false;
      promptArea.disabled = false;
      submit.disabled = false;

      submit.classList.remove(
        'bg-gray-500',
        'hover:bg-gray-500',
        'cursor-not-allowed'
      );
    }
  });
});
