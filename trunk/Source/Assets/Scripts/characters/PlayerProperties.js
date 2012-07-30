#pragma strict

// Player properties Component
// Description: set and stores pickups and state of player

enum PlayerState			// main character states builded as bitfields to had simultaneidity & more control
{	
	Asleep 			= 0,	
	Flickering 		= 1,		
	Normal			= 2,		
	Invisible		= 4,
	Small			= 8,
	WildFire		= 16
}
public var playerState 	 : PlayerState 	= PlayerState.Normal;		// set display state of mario in Inspector 

enum Items		{ Empty = 0, Hat = 1, Whistler = 2, Invisibility = 4, Smallibility = 8, Fire = 16 }

public var Inventory	 	: Items	= Items.Empty;					// Inventory system activation

var lifes					: int	= 3;
var health					: int	= 2;
var key						: int   = 0;
var fireGauge				: int   = 0;							// Character Caña Gauge power state increment x1, x2 y x3
//var hatPower				: int   = 0;
var fruits					: int  	= 0;							// Ñangapiry fruits it's the same as coins in other games
private var fruitLife		: int 	= 20;							// fruits amount to get 1+ extra life for the plahyer 					

var projectileHat			: GameObject;							
var projectileFire			: GameObject;

var changeState				: boolean 	= true;						// flag to switch state

@HideInInspector var dead 	: boolean 	= false;					// general flags to knew current player state
@HideInInspector var normal	: boolean 	= false;
@HideInInspector var inmune	: boolean 	= false;

private var HoldingKey		: boolean 	= false;					// simple flag to know if the throwing button was released 
private var wasKinematic	: boolean 	= false;					// flag to remeber if the taken thing was Kinematic or not
private var hitLeft			: boolean 	= false;					// flag to detect player collision with dangerous things
private var hitRight		: boolean 	= false;

//private var HatShoot		: boolean 	= false;

public  var soundDie		: AudioClip;
private var soundRate		: float 	= 0.0;
private var	soundDelay		: float 	= 0.0;

private var playerControls  : PlayerControls;
private var animPlay 		: AnimSprite; 							// : Component
private var charController 	: CharacterController;

public var GrabPosition   	: Vector3 	= Vector3( 0f, 0.5f, 0f);	// Grab & Throw Funcionality assuming obj has a rigidbody attached				
public var ThrowForce   	: float		= 400f;						// How strong the throw is. 
var hitDistance				: float 	= 3.0;						// Distance to push the player on being hitted

@HideInInspector var _pickedObject 	: Transform;					// is HoldingObj ? 
private var thisTransform			: Transform;					// own player tranform cached

function Start()
{
	thisTransform  = transform;
	playerControls = GetComponent ( PlayerControls );
	charController = GetComponent ( CharacterController );
	animPlay 	   = GetComponent ( AnimSprite);
	
	Inventory |= Items.Hat ;

	SetPlayerState( PlayerState.Asleep);
	
	while (true)
		yield CoUpdate();

}

function CoUpdate() : IEnumerator
{
	HitDead();
	UpdatePlayerState();
	if ( Input.GetButtonDown( "Fire1") ) HoldingKey = true;
   	if ( Input.GetButtonUp("Fire1")) HoldingKey = false;
}	


function UpdatePlayerState()
{
//	dead = ((playerState == 0) || ( playerState == PlayerState.WildFire ));		// Yep, when pombero's on fire it's dead, bad id
	normal = ((playerState != 0) || ( playerState != PlayerState.WildFire ));
	inmune = !normal 		|| ( (playerState  & PlayerState.Flickering) == PlayerState.Flickering );
	
	switch (playerState)
	{
		case PlayerState.Asleep:
			animPlay.PlayFrames ( 4, 3, 1, playerControls.orientation);
		
			if ( changeState )
			{
				renderer.enabled = true;
				renderer.material.color = Color.white;
				playerControls.enabled = false;
				changeState = false;
				yield Sleeping();
			}
			
			if ( Input.GetButtonUp("Fire1") || Input.GetButtonUp("Jump") )
			{
				playerControls.enabled = true;
				SetPlayerState( PlayerState.Flickering );	
			}
			break;
			
		case PlayerState.WildFire:
			playerState |= PlayerState.Normal;
			yield Burning();
			break;
			
		default:
			playerState |= PlayerState.Normal; // This its needed in case of direct switch from Unity GUI drag & drop
			
			if( (playerState  & PlayerState.Flickering) == PlayerState.Flickering )
				if ( changeState )	{ changeState = false; 	yield Flickering();		}
			
		
			if( (playerState  & PlayerState.Invisible) == PlayerState.Invisible )
				if ( changeState )	{ changeState = false; yield Invisible(); }
						
//			if( (playerState  & PlayerState.Small) == PlayerState.Small )
//			{
//				if ( changeState )	{ changeState = false; yield Small(); }
//			}
			
			if ( Input.GetButton("Fire1") && !HoldingKey )		PlayerThrows();
			else 
				if ( !_pickedObject && Input.GetButtonDown("Fire2")	)	UseInventory();

//		if (  !_pickedObject && HatShoot && Input.GetButtonDown("Fire2")) ThrowHat(); // ThrowHat();
	}
	
}

////////////////////////////////////////////////////////////////////////////////////////////////// COLLISIONS

 
function OnTriggerEnter( other : Collider )
{
	if ( other.CompareTag( "Enemy") && !inmune )
//		&& thisTransform.position.y  < other.transform.position.y + 0.1  )		// if collide with one side box...
	{
		 hitLeft =( thisTransform.position.x  < other.transform.position.x );	// check left toggle true  
		 
		 hitRight =( thisTransform.position.x  > other.transform.position.x );	// check right toggle true  
	}
	
	if ( other.name == "Hat" )//other.CompareTag( "p_shot") && !HatShoot   )
	{
		Destroy( other.gameObject );
		renderer.material.SetFloat("_KeyY", 0.05);
		Inventory |= Items.Hat ;
	}

}


function OnTriggerStay( hit : Collider)  					// function OnControllerColliderHit (hit : ControllerColliderHit)
{
 	if ( HoldingKey &&  hit.CompareTag( "pickup") )// ||  hit.CompareTag( "p_shot") )
// 	if ( Input.GetButtonDown( "Fire1") && hit.CompareTag( "pickup") ||  hit.CompareTag( "p_shot") )

       if ( playerState < 8 && !_pickedObject  )
       {
//         HoldingKey = true;
             	
         _pickedObject = hit.transform; 									// caches the picked object
         
         ThrowForce = _pickedObject.rigidbody.mass * 5;
         
         wasKinematic = _pickedObject.rigidbody.isKinematic;
         _pickedObject.rigidbody.isKinematic = true;
         
    	  Physics.IgnoreCollision(_pickedObject.collider, gameObject.collider, true );
    	  
         _pickedObject.collider.enabled = false;	 

         									//this will snap the picked object to the "hands" of the player
         _pickedObject.position = thisTransform.position + GrabPosition; 	// Could be changed with every object properties

         									//this will set the HoldPosition as the parent of the pickup so it will stay there
         _pickedObject.parent = thisTransform; 

       }
       
}

function HitDead()
{
	if ((hitRight || hitLeft ))												// If we were hitten get pushdirection 
	{
		var pushDirection = System.Convert.ToByte(hitLeft) - System.Convert.ToByte(hitRight) ; // hitLeft == 1, hitRight == -1
		hitLeft = false;
		hitRight = false;

		var orientation = playerControls.orientation;							
		
	
		if ( health )														// If health still available do damage and continue 
		{
			health -= 1;
//			AddPlayerState( PlayerState.Flickering );
			
			var hurtTimer = Time.time + 0.2;
			while( hurtTimer > Time.time )
			{
				thisTransform.Translate( -pushDirection * hitDistance * Time.deltaTime, hitDistance  * Time.deltaTime, 0);
				animPlay.PlayFrames( 2, 3, 1, orientation); 
    	 		yield;
		 	}
//			health -= 1;
			AddPlayerState( PlayerState.Flickering );
		}
		else																// else lose a Life and start dying mode
		{
			lifes -= 1;
			renderer.material.color = Color.white;
			renderer.enabled = true;

			playerControls.enabled = false;
			var dieTimer = Time.time + 0.5f;
 			while( dieTimer > Time.time )									// Do jump and sad animation...
			{
//				thisTransform.Translate( -pushDirection * hitDistance * Time.deltaTime * .5, 0, 0);
				charController.Move( Vector3( -pushDirection * hitDistance * Time.deltaTime * .5, 
															hitDistance * Time.deltaTime , 0) );
				animPlay.PlayFrames( 2, 3, 1, orientation);
				yield;
			}

			while ( !charController.isGrounded )							// set to ground the character ...
			{
				charController.Move( Vector3( 0, -4.0, 0 ) * Time.deltaTime );
				yield;
			}
			
			dieTimer = 0.0f;
 			while( dieTimer < 3.0 )											// Do Hat flying animation
			{
				dieTimer += Time.deltaTime * 2;
			
				animPlay.PlayFrames( 4, Mathf.FloorToInt(dieTimer), 1, orientation);
				yield;
			}
			
			health = 2;
//			if ( lifes )
			SetPlayerState( PlayerState.Asleep );							// if there are life change state to Asleep
//			else 															// else GameOver
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////





function UseInventory()
{
	switch ( Inventory )
	{
		case Items.Empty: 
			break;
			
		case Items.Hat: 								// Throw Hat..
		if( (Inventory  & Items.Hat) == Items.Hat )
			ThrowHat();
			Inventory &= (~Items.Hat);
			break;
						
		case Items.Whistler:							// Wisp Whistler
			Inventory &= (~Items.Whistler);
			break;
			
		case Items.Invisibility:						// Turn Invisible 
			AddPlayerState( PlayerState.Invisible );
			Inventory &= (~Items.Invisibility);
			break;
			
		case Items.Smallibility: 						// Get Smaller
			Inventory &= (~Items.Smallibility);
			break;			
			
		case Items.Fire: 								// Do Fire things..
				if ( fireGauge == 1 ) ; 	// instantiate flame
			else 
				if ( fireGauge  < 3 ) ;	// instantiate fireball
			else
				SetPlayerState( PlayerState.WildFire );
							  
			fireGauge = 0;
			Inventory &= (~Items.Fire);
			break;
	}
}




function Sleeping()		: IEnumerator
{
	while ( !charController.isGrounded )
	{
		charController.Move( Vector3( 0, -1.0, 0 ) * Time.deltaTime );
		
		if ( playerState ) return; 
		
		yield;	
	}
}

function Flickering()	: IEnumerator
{
	var timertrigger = Time.time + 5;
	
	while( timertrigger > Time.time )
	{
		if(Time.frameCount % 4 == 0)
			renderer.enabled = !renderer.enabled;

		if ( !normal ) return;
		
		yield ;
	}
	
		renderer.enabled = true;
//		playerState &= ( PlayerState.Normal | PlayerState.Invisible);
		playerState &= (~PlayerState.Flickering);
}

function Small()		: IEnumerator
{
	SetPlayerState( PlayerState.Normal);

}

function Invisible()	: IEnumerator
{
	var timertrigger = Time.time + 20;
			 
	while( timertrigger > Time.time )
	{

 			var lerp : float = Mathf.PingPong (Time.time * .45f, 1.0) ;
 			renderer.material.SetFloat( "_Cutoff", Mathf.Lerp ( -0.15f, .7f,  lerp));

		if ( !normal ) return;
			
		yield ;			 
	}

 		renderer.material.SetFloat( "_Cutoff", 0.9);

// 		renderer.material.color = Color.white;
//		playerState &= ( PlayerState.Normal | PlayerState.Flickering);
		playerState &= (~PlayerState.Invisible);

}

function Burning()		: IEnumerator
{
//	renderer.material = materialFire;
	renderer.material.color = Color.white;
	renderer.enabled = true;
	var timertrigger = Time.time + 20;
	
	while( timertrigger > Time.time )
	{

// 		var lerp : float = Mathf.PingPong (Time.time, 1.0) / 1.0;
//    	renderer.material.color = Color.Lerp (Color.red, Color.yellow, lerp);
		if(Time.frameCount % 2 == 0)
			renderer.material.color = Color.red;
		else 
			renderer.material.color = Color.yellow;
						
//		if ( playerState != PlayerState.WildFire ) return; 
		if ( !playerState  ) return; 

		
		yield;
	}
	
	renderer.material.color = Color.white;
//	playerState &= PlayerState.Normal ;
	playerState &= (~PlayerState.WildFire);
}

function ThrowHat()
{
	// Instantiate the projectile
    var clone : GameObject = Instantiate (projectileHat, thisTransform.position , thisTransform.rotation);
    
    Physics.IgnoreCollision(clone.collider, this.gameObject.collider, true );	 // it works but the distance it s lame

    clone.name = "Hat";

	clone.GetComponent(BulletShot).FireBoomerang( Vector3( playerControls.orientation * 8, 0, 0) , 1, 0, 4);
	// shot with a short animation
  
	renderer.material.SetFloat("_KeyY", 0.25);
     
    var timertrigger = Time.time + 0.25f;
	while( timertrigger > Time.time )
	{
		animPlay.PlayFrames( 3, 1, 1, playerControls.orientation); 
     	yield;
	}
	Physics.IgnoreCollision(clone.collider, this.gameObject.collider, false);
}

function ThrowFire()
{
    var orientation = playerControls.orientation;  	 							// Instantiate the projectile
     	 	    
	
    var clone : GameObject = Instantiate (projectileFire,
    									  thisTransform.position + Vector3(orientation * .25,0,0),
    									   thisTransform.rotation);
    Physics.IgnoreCollision(clone.collider, this.gameObject.collider); 			// it works but the distance it s lame
 // clone.thisTransform.Translate( Vector3( 0, 1, 0) ); 					// avoid hits between shot & shooter own colliders  

    clone.name = "Fire";

	playerControls.enabled = false;
	
	// Add speed to the target
	clone.GetComponent(BulletShot).Fire(  Vector3( orientation * 4, 0, 0), 10);  // shot with a short animation
    
    var timertrigger = Time.time + 0.75f;
	while( timertrigger > Time.time )
	{
		animPlay.PlayFrames( 3, 6, 2, orientation); 
     	yield;
	}
   	playerControls.enabled = true;
	
}

function PlayerThrows()												// Object Throwing without physics engine
{
    if ( _pickedObject )
    {    	
    	
	   	  var orientation = playerControls.orientation;
	   	
       	 _pickedObject.parent = null;        		//resets the pickup's parent to null so it won't keep following the player	

         _pickedObject.collider.enabled = true;
         
         _pickedObject.tag = "p_shot" ;
                    
         _pickedObject.rigidbody.isKinematic =	wasKinematic;
         
                           
         //applies force to the rigidbody to create a throw
//       pickedObject.rigidbody.AddForce( Vector3( orientation, 1,0) * ThrowForce, ForceMode.Impulse);
		 if ( !_pickedObject.rigidbody.isKinematic )
         {
//         	_pickedObject.collider.isTrigger = true;
		   	_pickedObject.rigidbody.AddForce( Vector3( orientation, Input.GetAxis( "Vertical"),0) * ThrowForce, ForceMode.Impulse);
//       pickedObject.position += Vector3( orientation, Input.GetAxis( "Vertical"),0) * 1.5;
  		 }
    	
    	 Physics.IgnoreCollision(_pickedObject.collider, gameObject.collider, false );	
    	 
//    	    EditorApplication.isPaused = true;
  		
         //resets the _pickedObject 
         _pickedObject = null;
         
         var timertrigger = Time.time + 0.55f;
		 while( timertrigger > Time.time )
		 {
			animPlay.PlayFrames( 3, 1, 1, orientation); 
         	HoldingKey = false;
			
    	 	yield;
		 }
		 
		 
	}
}








function SetPlayerState( newState : PlayerState )
{
	playerState = newState;									// change to a new playerState & delete all previous 
	changeState = true;
}

function AddPlayerState( newState : PlayerState )
{
	playerState |= newState;								// add a new playerState & keep all previous 
	changeState = true;
}
	
function PlaySound ( soundName : AudioClip, soundDelay : float)
{
	if ( !audio.isPlaying && Time.time > soundRate )
	{
		soundRate = Time.time + soundDelay;
		audio.clip = soundName;
		audio.Play();
		yield WaitForSeconds ( audio.clip.length );
	}
}
//function PlayerLives()
//{
//	if ( lifes == 0 )
//	{
////		PlaySound ( soundDie, 0 );
//		yield WaitForSeconds ( 3 );
//		print("Player is Dead");
////		Application.LoadLevel ( "pombe Screen Lose" );
//	}
//}

function AddKeys (  numKey : int)
{
	key += numKey;

}

function AddCoin(numCoin : int)
{
	fruits += numCoin;
}


@script AddComponentMenu( "Utility/Player Propierties Script" )

