#!/bin/bash
# توليد التعليق الصوتي العربي والإنجليزي للحلقة 29
DIR=/home/ubuntu/daousha/docs/episode29
mkdir -p "$DIR"

# عربي — صوت أحمد (ar-EG)
edge-tts --voice ar-EG-ShakirAudio --rate="-2%" --pitch="+2Hz" \
  --text "ما رأيك بعالم عام 2099؟ أنا واثق أنك لم تره من قبل! اسمع هذه الحقائق الثلاثة وستتغير نظرتك للمستقبل! الحقيقة الأولى: مدن كاملة تحت قباب زجاجية تحمي سكانها من العواصف، وتُبنى في الصحراء والمحيطات! الحقيقة الثانية: السيارات الطائرة لن تكون خيالًا، بل ستملأ السماء فوق رأسك كل صباح! الحقيقة الثالثة: روبوتات ذكية ستنظف شوارعك وتحمل أغراضك وتعتني بكبار السن! أنتم خير ونور من الله. هل تتخيل نفسك في مدينة 2099؟ أخبرني في التعليقات! تابع دوشة!" \
  --write-media "$DIR/narration29-ar.wav"

# إنجليزي — صوت Guy (en-US)
edge-tts --voice en-US-GuyNeural --rate="-2%" --pitch="+2Hz" \
  --text "What do you think of the year 2099? I'm sure you've never seen it before! Listen to these three facts and your view of the future will change! Fact one: entire cities under giant glass domes protecting people from storms, built in deserts and oceans! Fact two: flying cars won't be a fantasy, they'll fill the sky above your head every morning! Fact three: smart robots will clean your streets, carry your things, and care for the elderly! You are goodness and light from God. Can you imagine yourself in a 2099 city? Tell me in the comments! Follow Dawsha!" \
  --write-media "$DIR/narration29-en.wav"

for f in "$DIR"/narration29-*.wav; do
  echo -n "$f: "; ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"
done
