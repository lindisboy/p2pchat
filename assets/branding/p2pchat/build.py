from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import Image
import base64, hashlib, json, math, subprocess
import numpy as np
ROOT=Path(__file__).resolve().parent
INK,PAPER,FERN,MINT,NIGHT='#202c31','#f3f0e8','#246c73','#9cced0','#17252c'
CLAY,OCHRE,SLATE,PLUM='#a04434','#91611b','#485a83','#745271'
FONTS={name:TTFont(ROOT/'source'/filename) for name,filename in [('Anton','Anton-Regular.ttf'),('Inter','Inter.ttf')]}
def rgb(v):return np.array([int(v[i:i+2],16) for i in (1,3,5)],dtype=float)
def recolor(src,dst,reverse=False,multicolor=False):
 im=Image.open(src).convert('RGBA');p=np.asarray(im).copy();c=p[:,:,:3].astype(float)/255
 mx,mn=c.max(axis=2),c.min(axis=2);sat=(mx-mn>(.20 if multicolor else .10))&(mx>.12);bright=(~sat)&(mx>.65)
 out=np.zeros_like(c)+(rgb(PAPER) if reverse else rgb(INK));out[sat]=rgb(FERN);out[bright]=rgb(PAPER)
 if multicolor:
  hsv=np.asarray(im.convert('RGB').convert('HSV'));hue=hsv[:,:,0].astype(float)*360/255
  for start,end,color in [(0,15,CLAY),(15,35,'#b96543'),(35,80,OCHRE),(180,260,SLATE),(260,310,FERN),(310,340,PLUM),(340,361,CLAY)]:
   out[sat & (hue>=start) & (hue<end)]=rgb(color)
 p[:,:,:3]=out.clip(0,255).astype('uint8');Image.fromarray(p).save(dst)
 assert np.array_equal(p[:,:,3],np.asarray(im)[:,:,3])
def words(value,x,y,h,color=INK,face='Inter'):
 f=FONTS[face];gs=f.getGlyphSet();cm=f.getBestCmap();cursor=0;paths=[]
 for c in value:
  g=gs[cm[ord(c)]];pen=SVGPathPen(gs);g.draw(pen)
  paths.append(f'<path transform="translate({cursor} 0)" d="{pen.getCommands()}"/>');cursor+=g.width+(30 if face=='Anton' else 0)
 bp=BoundsPen(gs);gs[cm[ord('H')]].draw(bp);scale=h/bp.bounds[3]
 return f'<g fill="{color}" transform="translate({x} {y+h}) scale({scale} {-scale})">'+''.join(paths)+'</g>'
def pic(path,x,y,w,h):
 data=base64.b64encode(Path(path).read_bytes()).decode()
 return f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="data:image/png;base64,{data}"/>'
def rect(x,y,w,h,c):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>'
def export(name,w,h,body,bg=None,pdf=False):
 p=ROOT/(name+'.svg');p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="P2PCHAT brand artwork">'+(rect(0,0,w,h,bg) if bg else '')+body+'</svg>\n')
 subprocess.run(['rsvg-convert',str(p),'-o',str(p.with_suffix('.png'))],check=True)
 if pdf:subprocess.run(['rsvg-convert','-f','pdf',str(p),'-o',str(p.with_suffix('.pdf'))],check=True)
def lock(x,y,s=1,reverse=False):
 return pic(ROOT/('symbol-reverse.png' if reverse else 'symbol.png'),x,y,156*s,151*s)+words('P2PCHAT',x+188*s,y+31*s,94*s,PAPER if reverse else INK,'Anton')
def token(v,t='color'):return {'$type':t,'$value':v}
def ramp(chroma,hue):
 result={}
 for shade,L in zip([50,100,200,300,400,500,600,700,800,900,950],[.97,.93,.86,.76,.65,.53,.46,.39,.32,.24,.15]):
  a,b=chroma*math.cos(math.radians(hue)),chroma*math.sin(math.radians(hue))
  l,m,s=(L+.3963377774*a+.2158037573*b)**3,(L-.1055613458*a-.0638541728*b)**3,(L-.0894841775*a-1.291485548*b)**3
  linear=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]
  srgb=[12.92*v if v<=.0031308 else 1.055*v**(1/2.4)-.055 for v in linear]
  v='#'+''.join(f'{round(max(0,min(1,v))*255):02x}' for v in srgb)
  result[str(shade)]=token(v);result[str(shade)]['$extensions']={'p2pchat':{'oklch':[L,chroma,hue]}}
 return result
def make_tokens():
 light={'text':{'primary':INK,'secondary':'#506169','tertiary':'#506169','link':FERN,'on-action':PAPER},'surface':{'page':PAPER,'card':'#ffffff','raised':'#dce7e5'},'border':{'default':'#c8d3d1','strong':'#73858a'},'action':{'primary':FERN,'primary-hover':'#1c565c','primary-active':'#17464b','destructive':CLAY,'disabled':'#dce7e5'},'feedback':{'success':'#416648','error':CLAY,'warning':OCHRE,'info':SLATE},'accent':{'clay':CLAY,'ochre':OCHRE,'slate':SLATE,'plum':PLUM}}
 dark={'text':{'primary':PAPER,'secondary':'#becbcf','tertiary':'#becbcf','link':MINT,'on-action':NIGHT},'surface':{'page':NIGHT,'card':INK,'raised':'#2c3b41'},'border':{'default':'#40545c','strong':'#8fa1a8'},'action':{'primary':MINT,'primary-hover':'#b1dcdd','primary-active':'#c2e5e6','destructive':'#e9a394','disabled':'#40545c'},'feedback':{'success':'#b2ccb0','error':'#e9a394','warning':'#dac18f','info':'#b3c0e0'},'accent':{'clay':'#e9a394','ochre':'#dac18f','slate':'#b3c0e0','plum':'#d2b0ca'}}
 sem=lambda obj:{k:{n:token(v) for n,v in group.items()} for k,group in obj.items()}
 colors={'primitive':{'teal':ramp(.07,195),'neutral':ramp(.012,220),'brand':{k:token(v) for k,v in {'ink':INK,'paper':PAPER,'teal':FERN,'sea-glass':MINT,'night':NIGHT,'clay':CLAY,'ochre':OCHRE,'slate':SLATE,'plum':PLUM}.items()}},'semantic':sem(light),'dark':sem(dark),'component':{'button':{'background':token('{semantic.action.primary}'),'text':token('{semantic.text.on-action}'),'focus':token('{semantic.text.link}')},'input':{'text':token('{semantic.text.primary}'),'border':token('{semantic.border.strong}')},'message':{'sent':token('{semantic.surface.raised}'),'received':token('{semantic.surface.card}')}}}
 # Semantic roles reference primitives; dark overrides use the same catalog.
 for section in ['semantic','dark']:
  for group,entries in colors[section].items():
   for name,t in entries.items():
    value=t['$value'];key=next((k for k,v in colors['primitive']['brand'].items() if v['$value']==value),None)
    if key is None:key=section+'-'+group+'-'+name;colors['primitive']['brand'][key]=token(value)
    t['$value']='{primitive.brand.'+key+'}'
 (ROOT/'tokens/colors.json').write_text(json.dumps(colors,indent=2)+'\n')
 scales={'type':{'display':token('Anton','fontFamily'),'body':token('Inter','fontFamily'),'size':{str(i):token({'value':v,'unit':'px'},'dimension') for i,v in enumerate([12.8,16,20,25,31.25,39.0625,48.828])}},'space':{str(v):token({'value':v,'unit':'px'},'dimension') for v in [0,4,8,12,16,24,32,48,64,96]},'radius':{str(v):token({'value':v,'unit':'px'},'dimension') for v in [0,4,8,16]},'motion':{'instant':token({'value':0,'unit':'ms'},'duration'),'feedback':token({'value':120,'unit':'ms'},'duration'),'settle':token({'value':200,'unit':'ms'},'duration'),'ease':token([.2,0,0,1],'cubicBezier')},'elevation':{'flat':token({'color':'#18221d00','offsetX':{'value':0,'unit':'px'},'offsetY':{'value':0,'unit':'px'},'blur':{'value':0,'unit':'px'},'spread':{'value':0,'unit':'px'}},'shadow')}}
 (ROOT/'tokens/scales.json').write_text(json.dumps(scales,indent=2)+'\n')
 css='@font-face{font-family:Anton;src:url("source/Anton-Regular.ttf")}\n@font-face{font-family:Inter;src:url("source/Inter.ttf");font-weight:100 900}\n'
 for selector,obj in [(':root',light),('[data-theme="dark"]',dark)]:css+=selector+'{\n'+''.join(f'  --{g}-{n}:{v};\n' for g,entries in obj.items() for n,v in entries.items())+'}\n'
 css+=':root{--font-display:Anton,sans-serif;--font-body:Inter,sans-serif;--radius-control:4px;--radius-panel:8px;--space-unit:4px;--duration-feedback:120ms;--ease-feedback:cubic-bezier(.2,0,0,1);--button-background:var(--action-primary);--button-text:var(--text-on-action);--input-border:var(--border-strong)}\n@media(prefers-reduced-motion:reduce){:root{--duration-feedback:0ms}}\n'
 (ROOT/'theme.css').write_text(css)
def page(n,title,body,bg=PAPER):
 export(f'guidelines/{n:02}',960,720,words(title,48,42,38,PAPER if bg==NIGHT else INK,'Anton')+body+words(f'P2PCHAT / BRAND KIT / {n}',48,670,11,MINT if bg==NIGHT else FERN),bg,True)
def main():
 recolor(ROOT/'source/originals/speech.png',ROOT/'symbol.png');recolor(ROOT/'source/originals/speech.png',ROOT/'symbol-reverse.png',True);recolor(ROOT/'source/originals/texture.png',ROOT/'texture-palette.png',multicolor=True)
 export('symbol',425,411,pic(ROOT/'symbol.png',0,0,425,411));export('symbol-reverse',425,411,pic(ROOT/'symbol-reverse.png',0,0,425,411))
 export('logo',632,216,lock(32,32));export('logo-paper',632,216,lock(32,32),PAPER,True);export('logo-reverse',632,216,lock(32,32,reverse=True));export('logo-dark',632,216,lock(32,32,reverse=True),NIGHT)
 export('wordmark',368,100,words('P2PCHAT',0,0,94,INK,'Anton'));export('wordmark-reverse',368,100,words('P2PCHAT',0,0,94,PAPER,'Anton'))
 export('avatar',512,512,pic(ROOT/'symbol.png',104,72,304,294)+words('P2PCHAT',80,398,86,INK,'Anton'),PAPER)
 export('app-icon',512,512,pic(ROOT/'symbol.png',72,78,368,356),PAPER)
 texture=ROOT/'texture-palette.png';Image.open(texture).crop((0,0,1254,260)).save(ROOT/'texture-band.png')
 export('banner',1600,640,lock(64,70,1.6)+pic(ROOT/'texture-band.png',0,412,1600,228),PAPER)
 page(1,'P2PCHAT',lock(48,190,1.35)+words('Visual identity for peer-to-peer messaging.',48,405,20)+pic(ROOT/'texture-band.png',0,510,960,145))
 page(2,'THE LOGO',lock(48,120,.95)+rect(0,330,960,220,NIGHT)+lock(48,360,.95,True)+words('Use the speech mark alone for the app icon. Keep the wordmark horizontal.',48,590,15)+words('Clear space: one P stem on every side. Minimum lockup width: 200 px.',48,620,15))
 body=''
 for i,(name,color) in enumerate([('Teal',FERN),('Clay',CLAY),('Ochre',OCHRE),('Slate',SLATE),('Plum',PLUM)]):
  x=48+i*174;body+=rect(x,135,154,170,color)+words(name,x,329,17)+words(color.upper(),x,359,14)
 body+=words('Teal is the tonal anchor. Supporting colors come from TIP artwork.',48,420,19)+words('Clay balances teal. Ochre, slate and plum bring contrast to the textures.',48,463,16)+words('Paper and charcoal carry text. Use one supporting color at a time in UI.',48,503,16)+words('Sea glass replaces teal for dark-theme actions. Tokens include both themes.',48,562,16)
 page(3,'PALETTE',body)
 page(4,'TYPE & VOICE',words('KEEP TALKING.',48,150,92,INK,'Anton')+words('Anton / wordmark and short display headings',48,280,17)+words('Inter / messages, navigation, instructions and body text',48,345,22)+words('Use sentence case in the app. Keep labels direct.',48,400,20)+words('Examples: Add a contact. Retry sending. Message queued.',48,444,18)+words('No claims of anonymity or delivery without evidence.',48,492,18)+words('Body base: 16 px. Type scale: 1.25. Spacing unit: 4 px.',48,562,16)+words('Anton and Inter are supplied with SIL Open Font License files.',48,605,15))
 page(5,'TEXTURE',pic(texture,560,118,350,350)+lock(48,150,.65)+words('Use on covers and banners.',48,350,17)+words('Keep messages on plain surfaces.',48,391,17)+words('TIP color relationships remain:',48,438,16)+words('warm fields meet cool fields.',48,467,16)+words('Do not put small text over the texture.',48,524,18)+words('Do not add generated artwork or redraw the supplied motifs.',48,579,16))
 page(6,'ASSETS & SOURCES',words('Included',48,130,30,INK,'Anton')+words('Light / dark logos, wordmarks, speech marks, square icons and banner.',48,195,18)+words('SVG, PNG and PDF exports. Token JSON, theme CSS and rebuild script.',48,237,18)+words('Source artwork',48,310,30,INK,'Anton')+words('Speech: supplied TIP icon export, 425 x 411 pixels.',48,370,18)+words('Texture: supplied original Texture.png, 1254 x 1254 pixels.',48,407,18)+words('Original copies remain intact. Only palette derivatives were made.',48,444,18)+words('The kit does not identify the artist or provide a graphic reuse license.',48,481,16)+words('The speech symbol remains raster inside SVGs. The wordmark is vector.',48,537,16)+words('No generated imagery, purchased stock, gradients or invented claims.',48,595,16))
 subprocess.run(['pdfunite',*[str(ROOT/f'guidelines/{i:02}.pdf') for i in range(1,7)],str(ROOT/'p2pchat-brand-kit.pdf')],check=True)
 (ROOT/'p2pchat-logo.pdf').write_bytes((ROOT/'logo-paper.pdf').read_bytes())
 preview=Image.new('RGB',(1440,1080),PAPER)
 for i in range(4):
  im=Image.open(ROOT/f'guidelines/{i+1:02}.png');im.thumbnail((720,540));preview.paste(im,((i%2)*720,(i//2)*540))
 preview.save(ROOT/'preview.png');make_tokens()
 hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'source/originals').glob('*.png')};(ROOT/'source/originals/SHA256.json').write_text(json.dumps(hashes,indent=2)+'\n')
 print('Built logo variants, 6 guideline pages, PDFs, textures and tokens.')
if __name__=='__main__':main()
