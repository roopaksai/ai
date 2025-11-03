import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const AppContainer = styled.div`
  background-color: #1a1a1a;
  min-height: 100vh;
  color: #fff;
  padding: 20px;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  h1 {
    color: #4CAF50;
    font-size: 2.5em;
  }
`;

const ChatContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Message = styled.div`
  margin: 10px 0;
  padding: 15px;
  border-radius: 10px;
  max-width: 70%;
  ${props => props.isUser ? `
    background-color: #2c5282;
    margin-left: auto;
  ` : `
    background-color: #2d3748;
    margin-right: auto;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  `}
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
`;

const MicButton = styled.button`
  background-color: ${props => props.isListening ? '#f44336' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px ${props => props.isListening ? 'rgba(244, 67, 54, 0.5)' : 'rgba(76, 175, 80, 0.5)'};
  
  &:hover {
    transform: scale(1.1);
  }

  svg {
    font-size: 30px;
  }
`;

const LanguageButton = styled.button`
  background-color: #2d3748;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: #4a5568;
  }
`;

const WaveformContainer = styled.div`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
`;

const WaveformBar = styled.div`
  width: 3px;
  background-color: #4CAF50;
  height: ${props => props.height}px;
  transition: height 0.1s ease;
`;

function App() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en');
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (window.webkitSpeechRecognition) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          handleMessage(transcript);
          setIsListening(false);
          recognition.stop();
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const handleMessage = async (text) => {
    // Add user message
    setMessages(prev => [...prev, { text, isUser: true }]);

    try {
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, language }),
      });

      const data = await response.json();
      const botResponse = data.response[language];

      // Add bot message
      setMessages(prev => [...prev, { text: botResponse, isUser: false }]);

      // Text-to-speech
      const utterance = new SpeechSynthesisUtterance(botResponse);
      utterance.lang = language === 'en' ? 'en-US' : 
                      language === 'hi' ? 'hi-IN' : 
                      language === 'te' ? 'te-IN' : 'kn-IN';
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        isUser: false 
      }]);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const toggleLanguage = () => {
    const langs = ['en', 'hi', 'te', 'kn'];
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  const Waveform = () => (
    <WaveformContainer>
      {[...Array(10)].map((_, i) => (
        <WaveformBar 
          key={i} 
          height={isListening ? Math.random() * 40 + 10 : 5} 
        />
      ))}
    </WaveformContainer>
  );

  return (
    <AppContainer>
      <Header>
        <h1>Smart Agriculture Advisor</h1>
        <Waveform />
      </Header>

      <ChatContainer>
        {messages.map((message, index) => (
          <Message key={index} isUser={message.isUser}>
            {message.isUser ? (
              message.text
            ) : (
              <Typewriter
                options={{
                  strings: [message.text],
                  autoStart: true,
                  delay: 30,
                  cursor: '',
                }}
              />
            )}
          </Message>
        ))}
      </ChatContainer>

      <Controls>
        <LanguageButton onClick={toggleLanguage}>
          <LanguageIcon />
          {language.toUpperCase()}
        </LanguageButton>
        
        <MicButton 
          onClick={toggleListening} 
          isListening={isListening}
        >
          <MicIcon />
        </MicButton>
      </Controls>
    </AppContainer>
  );
}

export default App;