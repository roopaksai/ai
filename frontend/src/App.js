import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import Typewriter from 'typewriter-effect';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    setAudio(null);

    try {
      const { data } = await axios.post(`${API_URL}/query`, {
        query,
        language,
        audio: true
      });

      setResponse(data.text[language]);
      if (data.audio) {
        setAudio(`data:audio/mp3;base64,${data.audio}`);
      }
    } catch (error) {
      setResponse('Sorry, something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audio) {
      const audioElement = new Audio(audio);
      audioElement.play();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Campus Connect
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about campus..."
              variant="outlined"
              disabled={loading}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label="Language"
                disabled={loading}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">हिंदी</MenuItem>
                <MenuItem value="te">తెలుగు</MenuItem>
                <MenuItem value="kn">ಕನ್ನಡ</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              type="submit"
              variant="contained"
              disabled={!query || loading}
            >
              Ask
            </Button>
          </Box>
        </form>

        {response && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typewriter
                  options={{
                    string: response,
                    autoStart: true,
                    delay: 30,
                  }}
                />
              </Box>
              {audio && (
                <IconButton
                  onClick={playAudio}
                  color="primary"
                  sx={{ mt: -1 }}
                >
                  🔊
                </IconButton>
              )}
            </Box>
          </Paper>
        )}
      </Paper>
    </Container>
  );
}

export default App;