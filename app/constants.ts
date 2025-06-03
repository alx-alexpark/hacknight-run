// Configuration constants
import { FindItem } from './types';

export const CONFIG = {
    // API Configuration - now using Next.js API routes
    API_BASE_URL: "/api", // Next.js API routes

    // Mascot Configuration
    MASCOT_COUNTDOWN_SECONDS: 5,
    MASCOT_FRAME_SWITCH_INTERVAL: 500, // milliseconds between frame switches

    // UI Configuration
    MOBILE_BREAKPOINT: 768,


} as const;

// Hunt Items

export const HUNT_ITEMS: FindItem[] = [
    {
        name: "clock",
        prompt: "My hands move across the hour / check me when you need the time's power!",
        confidence: 0.3,
        enabled: true
    },
    {
        name: "cup",
        prompt: "Hold me close when you need a drink / ceramic or glass, what do you think?",
        confidence: 0.4,
        enabled: true
    },
    {
        name: "person",
        prompt: "Look around, can you see me here? / a human being, standing near!",
        confidence: 0.5,
        enabled: true
    },
    // {
    //     name: "vase",
    //     prompt: "Flowers I hold in elegant grace / decorative beauty in this place!",
    //     confidence: 0.4,
    //     enabled: true
    // },
    // {
    //     name: "dining table",
    //     prompt: "Gather around me for meals each day / where family and friends come to stay!",
    //     confidence: 0.4,
    //     enabled: true
    // },
    {
        name: "cell phone",
        prompt: "In your pocket or hand I stay / calls and texts throughout the day!",
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