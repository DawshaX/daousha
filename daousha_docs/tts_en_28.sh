#!/bin/bash
# توليد التعليق الصوتي الإنجليزي للحلقة 28
cd /home/ubuntu/daousha/docs/episode28
edge-tts --voice en-US-AriaNeural --rate=+8% \
  --text "What do you think the most expensive material in the entire universe is... worth trillions?! I am sure you have never heard of it, but listen to these three facts and your view of the world will change! Fact one: Antimatter is the most expensive substance on Earth, and a single gram costs over 60 trillion dollars, far more expensive than any diamond! Fact two: If we gathered every gram of antimatter humanity has ever produced, it would not fill a single teaspoon! Fact three: Antimatter never touches normal matter, because the moment they meet, they explode and vanish in a flash of pure energy! You are goodness and light from God... tell me in the comments: do you think humanity will one day learn to harness this energy?! Antimatter remains an unsolved mystery... Follow Dawsha!" \
  --write-media narration28-en.wav
