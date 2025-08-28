import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Wand2, RefreshCw, Lightbulb } from "lucide-react";
import SpinningWheel from "./spinning-wheel";

export default function BooksterOMatic() {
  const topics = ['💼 Business', '💕 Romance', '🚀 Sci-Fi', '👻 Horror', '💪 Self-Help', '🏃 Fitness', '🧒 Kids', '👨‍🍳 Cooking'];
  const audiences = ['💻 Professionals', '🎮 Teenagers', '👶 Parents', '👴 Retirees', '🚀 Founders', '🌍 Nomads', '🐕 Pet Owners', '🎓 Students'];
  const styles = ['📔 Diary', '😂 Humorous', '⚔️ Epic', '✨ Minimal', '📺 Documentary', '🎯 Adventure', '🎵 Rhyming', '🤖 Futuristic'];

  const [currentSelections, setCurrentSelections] = useState({
    topic: topics[0],
    audience: audiences[0],
    style: styles[0]
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    updateGeneratedPrompt();
  }, [currentSelections]);

  const updateGeneratedPrompt = () => {
    const topicClean = currentSelections.topic.split(' ').slice(1).join(' ');
    const audienceClean = currentSelections.audience.split(' ').slice(1).join(' ');
    const styleClean = currentSelections.style.split(' ').slice(1).join(' ');
    
    const prompt = `Create a ${topicClean.toLowerCase()} guide for ${audienceClean.toLowerCase()} written in ${styleClean.toLowerCase()} style. The book should be engaging, informative, and tailored specifically to this target audience's needs and preferences.`;
    setGeneratedPrompt(prompt);
  };

  const spinAllWheels = () => {
    // Spin each wheel with a slight delay
    setTimeout(() => {
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      setCurrentSelections(prev => ({ ...prev, topic: randomTopic }));
    }, 0);
    
    setTimeout(() => {
      const randomAudience = audiences[Math.floor(Math.random() * audiences.length)];
      setCurrentSelections(prev => ({ ...prev, audience: randomAudience }));
    }, 500);
    
    setTimeout(() => {
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      setCurrentSelections(prev => ({ ...prev, style: randomStyle }));
    }, 1000);
  };

  const handleTopicChange = (selection: string) => {
    setCurrentSelections(prev => ({ ...prev, topic: selection }));
  };

  const handleAudienceChange = (selection: string) => {
    setCurrentSelections(prev => ({ ...prev, audience: selection }));
  };

  const handleStyleChange = (selection: string) => {
    setCurrentSelections(prev => ({ ...prev, style: selection }));
  };

  return (
    <section id="bookster-o-matic" className="py-20 bg-muted/30" data-testid="bookster-o-matic-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-bookster-o-matic">BOOKSTER-O-MATIC</h2>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-spin-wheels">Spin the wheels to generate your perfect book idea!</p>
          <Badge variant="secondary" className="bg-accent text-accent-foreground" data-testid="badge-tip">
            <Lightbulb className="w-4 h-4 mr-2" />
            Tip: Click on any wheel to manually select options
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
          <SpinningWheel
            id="topic"
            title="TOPIC"
            options={topics}
            currentSelection={currentSelections.topic}
            onSelectionChange={handleTopicChange}
          />
          
          <SpinningWheel
            id="audience"
            title="AUDIENCE"
            options={audiences}
            currentSelection={currentSelections.audience}
            onSelectionChange={handleAudienceChange}
          />
          
          <SpinningWheel
            id="style"
            title="STYLE"
            options={styles}
            currentSelection={currentSelections.style}
            onSelectionChange={handleStyleChange}
          />
        </div>

        {/* Generated Prompt */}
        <Card className="shadow-lg" data-testid="card-generated-prompt">
          <CardContent className="p-8">
            <h4 className="text-lg font-semibold mb-4" data-testid="heading-generated-prompt">Generated Prompt:</h4>
            <div className="text-muted-foreground mb-6 p-4 bg-muted rounded-lg" data-testid="text-prompt">
              {generatedPrompt}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/create-book" className="flex-1">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-pink-500 text-white hover:opacity-90 transition-opacity"
                  data-testid="button-create-ebook"
                >
                  <Wand2 className="mr-2 w-5 h-5" />
                  CREATE E-BOOK NOW
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={spinAllWheels}
                data-testid="button-spin-all"
              >
                <RefreshCw className="mr-2 w-5 h-5" />
                SPIN ALL
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
