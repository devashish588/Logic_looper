/**
 * Word lists for Letter Lock.
 *
 * ANSWERS: everyday five-letter words that can be the word of the day. Kept
 * to words most players know, with no proper nouns, and nothing upsetting for
 * a casual daily game.
 *
 * EXTRA: valid guesses that are never picked as the answer (plurals, verb
 * forms and less common words), so players aren't told a real word "isn't in
 * the list". A guess is accepted if it is in either list.
 *
 * Lists are plain whitespace-separated text to keep this file readable.
 */

const split = (text) => text.trim().split(/\s+/);

const ANSWER_TEXT = `
about above actor acute adapt admit adopt adult after again agent agree ahead alarm album alert
alien alike alive allow alone along alter amaze amber among ample angel anger angle angry ankle
apart apple apply arena argue arise armor array arrow aside asset atlas attic audio avoid awake
award aware awful
bacon badge baker basic basin basis batch beach beard beast begin being belly below bench berry
birth black blade blame blank blast blaze bleak blend bless blind block blond blood bloom blown
board boast boost booth bound brain brake brand brave bread break breed brick bride brief bring
broad broke brook broom brown brush buddy build built bunch burst buyer
cabin cable camel candy canoe carry carve catch cause cease chain chair chalk champ chaos charm
chart chase cheap cheat check cheek cheer chess chest chief child chill chime china choir chose
chunk cider cigar civic civil claim clash class clean clear clerk click cliff climb cling clock
close cloth cloud clown coach coast cobra color comet comic coral couch cough could count court
cover crack craft crane crash crawl crazy cream creek crest crime crisp cross crowd crown crude
cruel crush crust curve cycle
daily dairy daisy dance dealt debut decay decor delay delta dense depth derby diary digit dirty
ditch diver dodge doing donor doubt dough dozen draft drain drama drank drape drawn dream dress
dried drift drill drink drive drove drums dusty dwarf dwell dying
eager eagle early earth easel eaten eight elbow elder elect elite email empty enact enemy enjoy
enter entry equal equip erase error essay event every exact exist extra
fable faint fairy faith false fancy fatal fault feast fence ferry fever fiber field fifth fifty
fight final first flame flare flash fleet flesh flick fling float flock flood floor flour fluid
flush focus foggy force forge forth forty forum found frame frank fraud fresh fried frill front
frost fruit fully funny
gamer gauge ghost giant given glade glare glass gleam glide globe gloom glory glove going grace
grade grain grand grant grape graph grasp grass grave great greed green greet grief grill grind
groan groom group grove growl grown guard guess guest guide guilt
habit hairy happy harsh haste hasty hatch haunt haven heart heavy hedge hello hence hinge hobby
hoist holly honey honor horse hotel hound house hover human humid humor hurry
icing ideal image imply inbox index inner input irony issue ivory
jelly jewel joint joker jolly judge juice juicy jumpy
karma kayak knack kneel knife knock known
label labor large laser later laugh layer learn lease least leave ledge legal lemon level lever
light limit linen liner lived liver lobby local lodge logic loose lover lower loyal lucky lunar
lunch lying
macro magic major maker mango maple march marry marsh mason match maybe mayor meant medal media
melon mercy merge merit merry metal meter might minor minus mirth mixed model moist money month
moral motor mount mouse mouth movie muddy music
naive naked nanny nasty naval needy nerve never newly niece night noble noise north notch noted
novel nurse nylon
oasis ocean offer often olive onion opera orbit order organ other otter ought outer owner oxide
ozone
paint panel panic paper party pasta paste patch pause peace peach pearl pedal penny perch phase
phone photo piano piece pilot pinch pitch pixel pizza place plain plane plant plate plaza plead
pluck plumb plume plump point poker polar polka pound power prank press price pride prime print
prior prism prize probe proof proud prove prune pulse punch pupil puppy purse
quack queen query quest quick quiet quilt quirk quite quota quote
radar radio raise rally ranch range rapid ratio reach react ready realm rebel refer reign relax
relay renew reply rider ridge rifle right rigid rinse risky rival river roast robin robot rocky
rough round route royal rugby ruler rural
sadly safer saint salad salon sandy sauce sauna scale scarf scene scent scoop scope score scout
scrap screw seize sense serve seven shade shake shall shame shape share shark sharp sheep sheet
shelf shell shift shine shiny shirt shock shoot shore short shout shown shrug sight silly since
sixth sixty skill skirt skull slate sleep slice slide slope small smart smell smile smoke snack
snake solar solid solve sorry sound south space spare spark speak speed spell spend spice spike
spine spoke spoon sport spray squad stack staff stage stain stair stake stamp stand stare start
state steak steam steel steep steer stern stick stiff still sting stock stone stood stool store
storm story stove straw strip stuck study stuff style sugar suite sunny super surge swamp swarm
swear sweat sweep sweet swept swift swing sword
table taste teach teeth tempo tenor tense tenth thank theft theme there thick thief thing think
third thorn those three threw throw thumb tiger tight timer tired title toast today token tooth
topic torch total touch tough towel tower toxic trace track trade trail train trait trash treat
trend trial tribe trick tried troop truck truly trunk trust truth tulip tuner twice twist
ultra uncle under unity until upper upset urban usage usual utter
vague valid valve vault venue verse video vigor villa vinyl viola viral virus visit vista vital
vivid vocal voice voter
wagon waist waste watch water weary weave wedge weigh weird whale wheat wheel where which while
white whole whose widen widow width wield witch woman world worry worse worst worth would wound
woven wrath wreck wrist write wrong wrote
yacht yearn yeast yield young youth
zebra zesty
`;

const EXTRA_TEXT = `
abase abate abbey abbot abide abort acorn adage adept admin agile aging agony aisle alley allot
aloft aloud alpha amend amino amuse angst anime annoy antic anvil aorta apron aptly arbor ardor
arson ashen aspen atone audit augur aunty avert avian await axiom azure abuse death devil slave tumor drown
bagel baggy balmy banal bandy banjo barge baron basil basso baste bathe baton bayou beech beefy
beget beige belch belie belle belts bento berth beset bevel bigot bilge billy binge bingo biome
birch bison bitty blimp bliss bloat blunt blurb blush boggy bogus bongo bonus booby boozy borax
bosom bossy botch bough boule bowel boxer brace braid brash brass bravo brawl brawn bribe brine
brink brisk broil broth bruin brunt brute bugle bulge bulky bully bumpy burly burnt burro bushy
butte butch buxom bylaw
cacao cadet cagey caper carat cargo carol carte caste cater cedar chafe chaff chant chasm chide
chimp chirp chock chore chuck chump churn chute cinch circa cited clamp clang clank clasp clave
cleft clone cloak clove clump clung coati cocoa colon combo conch condo cooky copse corer corny
corps coupe coven cower crabs craze creak creed creep crepe crick crony crook croon crumb crypt
cubed cubit cumin curry curse curvy cutie cynic
dally dandy datum davit deary debit debug decal decry deign deity delve demon demur denim depot
deter detox deuce dicey dimly diner dingo dingy diode dirge disco dishy ditto ditty divan divot
dizzy dolly dowdy downy dowry dowse drawl dread drier droll drone drool droop dross drupe dryly
duchy dully dummy dumpy duvet dwelt drunk
ebony eclat edict edify eerie egret eject elate elegy elfin elope elude elves embed ember emcee
emote endow enema ennui ensue envoy epoch epoxy erode erupt ethic ethos ether evade evict evoke
exalt excel exert exile expel extol exult
farce fatty fauna favor feign feint feral fetch fetus fibre fiend filet filly filmy filth finch
finer fishy fixed fizzy fjord flack flail flair flake flaky flank flora floss flout flown fluff
fluke flume flung flunk flyer foamy foist folio folly foray forgo forte foyer frail franc freak
freed freer frisk frock frond froth frown froze fugue fumed funky furor furry fussy fuzzy
gabby gaffe gaily gamma gamut gassy gaudy gaunt gavel gawky gayer gecko geeky genie genre ghoul
giddy girth gizmo glaze glean glint gloat gloss glued glyph gnash gnome godly golem golly goner
goody gooey goose gorge gouge gourd grail grate gravy graze grimy gripe groin grope gross grout
grubs gruel gruff grunt guava guild guile guise gulch gully gummy guppy gusto gusty
harem harpy hazel heady heath heave hefty heist helix hiker hilly hippo hitch hoard hoary homer
hokey homey hones hooch horde hotly hovel huffy hulks hulky humus hunch hunky hurts husky hydra
hyena hymns
icily idiom idiot idler idyll igloo iliac imbue impel inane incur indie inept inert infer ingot
inlay inlet inter intro ionic irate islet itchy
jaunt jazzy jerky jetty jiffy joist joust jowls juror
kappa karat kazoo khaki kiosk knave knead knelt knoll kudos
laden ladle lager lance lanky lapel lapse larva latch lathe latte leach leafy leaky leapt lefty
leggy lemur leper lilac limbo lipid lithe livid llama loamy loath lofty loner loopy lorry louse
lousy lowly lucid lumen lumpy lusty lymph lyric
macaw macho madam madly mafia magma maize mamma mammy manga mange mangy manic manly manor masse
matey maxim mecca meaty medic melee mensa messy midst milky mimic mince mocha mocks modem molar
mommy moody moose moped morel morph mossy motel motif motto mound mourn mucus mulch mummy munch
mural murky mushy musky musty myrrh
nadir nasal natty needs neigh nicer niche ninja ninth nippy nitro nobly nodal noisy nomad noose
nosey nudge nutty nymph
oaken oaths oddly offal ohmic oiled oiler ombre omega onset oozed opine optic ounce outdo outgo
ovary overt owing owlet oxbow
paddy pagan pager paled palsy pansy papal parka parry parse patio patty payee peaky pecan penal
penne peony perky pesky petal petty phony piety piggy pilaf pinto pious pique pithy pivot pixie
plaid plait plank plied plink plods ploys plush poesy polyp pooch poppy porch posed poser posit
posse pouch prawn preen prick privy prong prowl proxy prude psalm pudgy puffy pulpy pumps punky
pupae purge pushy putty pygmy
quail quake qualm quark quart quash quasi queer quell queue quoth
rabid racer radii radon rains rajah raked rakes ramen raspy ratty raven rayon razor rearm rebus
rebut recap recur recut reedy refit rehab reins relic remit renal repay repel resin retro retry
reuse revel revue rhino rhyme rifts rigor riled ripen risen riser ritzy rivet roach roomy roost
rooty rosin rotor rouse rover rowdy rower ruddy ruled rummy rumor rupee rusty
sabre saggy sails salsa salty salve salvo samba sassy satin satyr saucy savor savvy scald scalp
scaly scamp scant scare scary scold scone scorn scour scram scrub scuba sedan seedy segue sepia
serif serum setup sever sewer shack shady shaft shaky shale shave shawl shear sheen sheer shied
shirk shoal shone shrub shuck shunt shush shyly siege sieve sigma silky silty sinew singe siren
sixes skate skier skimp skied skulk slack slain slang slant slash slaty sleek sleet slept slick
slime slimy sling slink sloop slosh sloth slump slung slunk slurp slush slyly smack smash smear
smelt smirk smite smith smock smoky smote snafu snail snare snarl sneak sneer snide sniff snipe
snoop snore snort snout snowy snuck snuff soapy sober soggy soils sonic sooty sough soupy spade
spank spasm spawn spear speck spied spiel spiny spire spite splat split spoil spook spool spore
spout spunk spurt squat squid stead steed stink stint stoic stoke stole stomp stony stoop stork
stout strap stray strut stung stunk stunt suave sucks sulky sully sumac sunup surfs surly sushi
swath swash swell swill swine swirl swish swoon swoop swore sworn swung synod syrup
tabby tacky taffy taint taken taker tally talon tamer tango tangy taper tapir tardy tarot taunt
tawny teddy teary tease tepid terms terse thigh thine thong thump thyme tibia tidal tilde timid
tipsy titan tithe toady tonal tonic topaz toxin tract tramp trawl tread trove truce tryst tubal
tubby tucks tunic turbo tutor twang tweak tweed tweet twerp twill twine twirl twixt tying
udder ulcer umbra uncut undid undue unfed unfit unify union unite units unlit unmet unset untie
upend urine usher usurp utile
valet valor vapid vapor vaunt veers vegan venom verge verve vicar vigil vixen vodka vomit vouch
vowel vying
wacky wafer wager wages waltz warty waver waxen weedy weepy wench whack wharf whelp whiff whine
whirl whisk whoop wimpy wince winch windy wiper wispy witty wives woken woody wooed woozy wordy
wrack wring wryly
yahoo yodel yokel yummy
zonal zoned
`;

export const ANSWERS = [...new Set(split(ANSWER_TEXT))];
const ALLOWED = new Set([...ANSWERS, ...split(EXTRA_TEXT)]);

export const WORD_LENGTH = 5;

/** Is this a word we accept as a guess? (case-insensitive) */
export function isAllowedWord(word) {
    return typeof word === 'string' && ALLOWED.has(word.toLowerCase());
}

export const ALLOWED_COUNT = ALLOWED.size;
