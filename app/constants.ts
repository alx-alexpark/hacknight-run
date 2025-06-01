// Configuration constants
import { FindItem } from './types';

export const CONFIG = {
    // API Configuration - now using Next.js API routes
    API_BASE_URL: "/api", // Next.js API routes

    // Server-Sent Events URL (replaces WebSocket)
    EVENTS_URL: "/api/events", // Server-Sent Events for real-time updates

    // Mascot Configuration
    MASCOT_COUNTDOWN_SECONDS: 5,
    MASCOT_FRAME_SWITCH_INTERVAL: 500, // milliseconds between frame switches

    // UI Configuration
    MOBILE_BREAKPOINT: 768,

    
} as const;

// Hunt Items

export const HUNT_ITEMS: FindItem[] = [
    {
        name: "light switch",
        prompt: "One little switch and on comes the light / turn me off when the time is night!",
        confidence: 0.4,
        enabled: true
    },
    {
        name: "clock",
        prompt: "My hands move across the hour / check me when you need the time's power!",
        confidence: 0.3,
        enabled: true
    },
    {
        name: "door",
        prompt: "I open and close, I let you pass through / knock or turn the handle, I'm waiting for you!",
        confidence: 0.5,
        enabled: true
    },
    {
        name: "chair",
        prompt: "Four legs I have, but I cannot walk / sit upon me when you need to talk!",
        confidence: 0.4,
        enabled: true
    },
    {
        name: "light",
        prompt: "I banish darkness with my bright glow / flip my switch and watch me show!",
        confidence: 0.3,
        enabled: true
    },
    {
        name: "paper",
        prompt: "Write on me, draw on me, fold me in two / I'm thin and white and useful to you!",
        confidence: 0.4,
        enabled: true
    },
    {
        name: "book",
        prompt: "Pages and words, stories galore / open me up and knowledge explore!",
        confidence: 0.4,
        enabled: true
    },
    {
        name: "sink",
        prompt: "Water flows from my silver spout / wash your hands, don't go without!",
        confidence: 0.5,
        enabled: true
    },
    {
        name: "pencil",
        prompt: "Lead in my core, wood all around / for writing and drawing, I can be found!",
        confidence: 0.3,
        enabled: true
    },
    {
        name: "outlet",
        prompt: "Two or three holes in the wall I show / plug me in and electricity will flow!",
        confidence: 0.4,
        enabled: true
    },
    {
        name: "backpack",
        prompt: "Carry me on your shoulders so strong / books and supplies, I'll take along!",
        confidence: 0.4,
        enabled: true
    }
];

/*
Possoble items:
person
bicycle
car
motorcycle
airplane
bus
train
truck
boat
traffic light
fire hydrant
???
stop sign
parking meter
bench
bird
cat
dog
horse
sheep
cow
elephant
bear
zebra
giraffe
???
backpack
umbrella
???
???
handbag
tie
suitcase
frisbee
skis
snowboard
sports ball
kite
baseball bat
baseball glove
skateboard
surfboard
tennis racket
bottle
???
wine glass
cup
fork
knife
spoon
bowl
banana
apple
sandwich
orange
broccoli
carrot
hot dog
pizza
donut
cake
chair
couch
potted plant
bed
???
dining table
???
???
toilet
???
tv
laptop
mouse
remote
keyboard
cell phone
microwave
oven
toaster
sink
refrigerator
???
book
clock
vase
scissors
teddy bear
hair drier
toothbrush
*/