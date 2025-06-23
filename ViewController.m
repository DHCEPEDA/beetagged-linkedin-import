//
//  ViewController.m
//  Bees Chest
//
//  Created by Billy Irwin on 12/29/13.
//  Copyright (c) 2013 Arbrr. All rights reserved.
//

#import "ViewController.h"
#import "FBManager.h"
#import "BATypeAheadViewController.h"
#import <FontAwesomeKit/FAKZocial.h>
#import "ContactsViewController.h"


@interface ViewController ()

@end

@implementation ViewController

- (void)viewWillAppear:(BOOL)animated
{
//    if ([[FBManager singleton] loggedIn]) {
//        [self performSegueWithIdentifier:kLoginSegue sender:self];
//    }
    //[PFUser logOut];
    self.dimView.alpha = 0;
    [FBManager singleton].vc = self;
    FAKZocial *fb = [FAKZocial facebookIconWithSize:15];
    UIImage *fbImage = [fb imageWithSize:CGSizeMake(300, 50)];
    [self.loginBtn setImage:fbImage forState:UIControlStateNormal];
    
    self.loginBtn.alpha = 1;
    
    self.spinner = [[BASpinner alloc] initWithFrame:CGRectMake(kWidth/2-50, kHeight/2-50, 100, 100) andColor:[UIColor goldBeeColor] andBackgroundColor:[UIColor clearColor]];
    [self.view addSubview:self.spinner];
    
    self.dimView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, kWidth, kHeight)];
    self.dimView.backgroundColor = [UIColor colorWithRed:0 green:0 blue:0 alpha:0.2];
    self.dimView.alpha = 0;
    [self.view addSubview:self.dimView];
    
    [self.navigationController.navigationBar setHidden:YES];
}

- (void)setProgress:(float)value {
    [self.progressView setProgress:value animated:YES];
}


- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


- (void)viewDidLoad {
    [super viewDidLoad];
//    [PFUser logOut];
    //[PFUser logOut];
    self.loginBtn.alpha = 1;
    self.title = @"Facebook Profile";
    // Check if user is cached and linked to Facebook, if so, bypass login
    if ([PFUser currentUser] && [PFFacebookUtils isLinkedWithUser:[PFUser currentUser]]) {
        [self loginToApp];
    }
}


#pragma mark - Login mehtods

/* Login to facebook method */
- (IBAction)loginButtonTouchHandler:(id)sender  {
    [[FBManager singleton] clearDB]; //extra precaution to clear database before someone signs in
    NSLog(@"go");
   // [self startActivity];
    self.loginBtn.alpha = 0;
    //[self.spinner start];
    // Set permissions required from the facebook user account
    NSArray *permissionsArray = @[ @"user_about_me",
                                   @"user_relationships",
                                   @"user_birthday",
                                   @"user_location",
                                   @"user_work_history",
                                   @"user_education_history",
                                   @"user_hometown",
                                   @"friends_about_me",
                                   @"friends_birthday",
                                   @"friends_education_history",
                                   @"friends_hometown",
                                   @"friends_likes",
                                   @"friends_relationship_details",
                                   @"friends_relationships",
                                   @"friends_website",
                                   @"friends_work_history" ];
    
    // Login PFUser using facebook
    [PFFacebookUtils logInWithPermissions:permissionsArray block:^(PFUser *user, NSError *error) {
        [UIView animateWithDuration:0.3 animations:^{
           self.dimView.alpha = 1;
        }];
        [self.spinner start];
        self.loginBtn.alpha = 0;
        if (!user) {
            if (!error) {
                NSLog(@"Uh oh. The user cancelled the Facebook login.");
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Log In Error" message:@"Uh oh. The user cancelled the Facebook login." delegate:nil cancelButtonTitle:nil otherButtonTitles:@"Dismiss", nil];
                [alert show];
            } else {
                NSLog(@"Uh oh. An error occurred: %@", error);
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Log In Error" message:[error description] delegate:nil cancelButtonTitle:nil otherButtonTitles:@"Dismiss", nil];
                [alert show];
            }
        } else if (user.isNew) {
            NSLog(@"User with facebook signed up and logged in!");
            [self setFBId];
        } else {
            NSLog(@"User with facebook logged in!");
            [[FBManager singleton] cacheParseUser:user reformat:NO];
            [self fetchFriendsFromParse:0];
        }
    }];
    
    [_activityIndicator startAnimating]; // Show loading indicator until login is finished
}

- (void)setFBId {
    FBRequest *fbrequest = [FBRequest requestForMe];
    
    [fbrequest startWithCompletionHandler:^(FBRequestConnection *connection, id result, NSError *error) {
        //        if (!error) {
        // result is a dictionary with the user's Facebook data
        NSLog(@"got me");
        NSMutableDictionary *userData = [(NSDictionary *)result mutableCopy];
        
        [FBManager reformatEducation:userData];
        [FBManager reformatWork:userData];
        [FBManager reformatHometown:userData];
    
        NSString *fbid = userData[@"id"];
        [[PFUser currentUser] setValuesForKeysWithDictionary:userData];
        [[PFUser currentUser] setObject:fbid forKey:@"fbId"];
        [[PFUser currentUser] saveInBackground];
        
        PFObject *userModel = [PFObject objectWithClassName:@"UserModel"];
        [userModel setValuesForKeysWithDictionary:userData];
        [userModel setValue:fbid forKey:@"fbId"];
        [userModel saveInBackgroundWithBlock:^(BOOL succeeded, NSError *error) {
            [[FBManager singleton] cacheParseUser:[PFUser currentUser] reformat:NO];
            [self fetchFBFriends];
        }];
        
    }];

}


//grab 1000 friends at a time and save to core data
- (void)fetchFriendsFromParse:(int)skip {
    PFQuery *query = [PFQuery queryWithClassName:@"UserModel"];
    [query setLimit:1000];
    [query setSkip:skip];
    [query whereKey:@"fbId" containedIn:[[PFUser currentUser] objectForKey:@"connections"]];
    [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        for (PFObject *o in objects) {
            Contact *c = [Contact contactFromUserModel:o];
        }
        [[[FBManager singleton] managedObjectContext] save:nil];
        if (objects.count < 1000) {
            [self createTmpUserDict];
        } else {
            [self fetchFriendsFromParse:skip+1000];
        }
        
    }];
    
}

//logic needed to associate users with tags
- (void)createTmpUserDict {
    self.tmpUserDict = [[NSMutableDictionary alloc] init];
    [[FBManager singleton] fetchContacts];
    for (Contact *c in [FBManager singleton].fetchedResultsController.fetchedObjects) {
        c.tags_ = [[NSMutableDictionary alloc] init];
        self.tmpUserDict[c.fbId] = c;
    }
    NSLog(@"tmp dict size: %i", self.tmpUserDict.count);
    [self fetchTags:0];
}


//grab tags 1000 (parse limit) at a time and associate with user
- (void)fetchTags:(int)skip {
    NSLog(@"fetching tags");
    PFQuery *query = [PFQuery queryWithClassName:@"Tag"];
    [query setLimit:1000];
    [query setSkip:skip];
    [query whereKey:@"taggedBy" equalTo:[[PFUser currentUser] objectForKey:@"fbId"]];
    [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        for (PFObject *o in objects) {
            Tag *t = [Tag tagFromParse:o];
            Contact *c = self.tmpUserDict[t.tagUserId];
            NSLog(@"%@ %@", c.name, t.attributeName);
            [c.tags_ setObject:t forKey:t.attributeName];
        }
        
        [[[FBManager singleton] managedObjectContext] save:nil];
        if (objects.count < 1000) {
            [[FBManager singleton] fetchContacts];
            [self loginToApp];
        } else {
            [self fetchTags:skip+1000];
        }
        
        
    }];

}


//grab facebook friends to push to parse
- (void)fetchFBFriends
{
    FBRequest *friends = [FBRequest requestForGraphPath:@"me/friends?fields=about,bio,birthday,education,email,first_name,gender,id,hometown,last_name,name,relationship_status,work"];
    //FBRequest *friends = [FBRequest requestForGraphPath:@"me/friends"];
    [friends startWithCompletionHandler:^(FBRequestConnection *connection, id result, NSError *error) {
        if (error) {
            NSLog(@"error fetching friends %@", error);
            [PFUser logOut];
            //should logout user and have them restart
        } else {
            NSLog(@"friends: %@", result[@"data"]);
            NSArray *tags = @[@"Talkative", @"Stubborn", @"Passionate", @"Cute", @"Friendly"];
            [[FBManager singleton] importContacts:result[@"data"] cb:^(void) {
                FBManager *fb = [FBManager singleton];
                for (Contact *c in fb.fetchedResultsController.fetchedObjects) {
                    Tag *tag = [[Tag alloc] init];
                    tag.tagUserId = c.fbId;
                    tag.taggedBy = [[PFUser currentUser] objectForKey:@"fbId"];
                    tag.attributeName = tags[arc4random()%tags.count];
                    if (!c.tags_) {
                        c.tags_ = [[NSMutableDictionary alloc] init];
                    }
                    [c.tags_ setObject:tag forKey:tag.attributeName];
                    [fb.tagIndex add:c forTag:tag andSort:NO];
                }
                
                for (NSString *t in fb.tagIndex.data.allKeys) {
                    [fb.tagIndex sortForTagName:t];
                }
                
                
                [self loginToApp];
            }];
        }
    }];
}


// make sure to style the tab bar for the next view controller
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    UITabBarController *tabBarController = (UITabBarController *)[segue destinationViewController];
    UITabBarItem *contacts = tabBarController.tabBar.items[0];
    UITabBarItem *beeTagged = tabBarController.tabBar.items[1];
    UITabBarItem *myProfile = tabBarController.tabBar.items[2];
    
    contacts.title = @"Contacts";
    beeTagged.title = @"Bee Tagged";
    myProfile.title = @"My Profile";
    
    float imageSize = 40.0;
    float iconSize = imageSize * .6;
    FAKIonIcons *contactsIcon = [FAKIonIcons ios7PeopleIconWithSize:iconSize];
    UIImage *contactsImage = [contactsIcon imageWithSize:CGSizeMake(imageSize, imageSize)];
    
    FAKIonIcons *gameIcon = [FAKIonIcons gameControllerAIconWithSize:iconSize];
    UIImage *gameImage = [gameIcon imageWithSize:CGSizeMake(imageSize, imageSize)];
    
    FAKIonIcons *profileIcon = [FAKIonIcons cardIconWithSize:iconSize];
    UIImage *profileImage = [profileIcon imageWithSize:CGSizeMake(imageSize, imageSize)];
    
    [contacts setImage:contactsImage];
    [contacts setSelectedImage:contactsImage];
    
    [beeTagged setImage:gameImage];
    [beeTagged setSelectedImage:gameImage];
    
    [myProfile setImage:profileImage];
    [myProfile setSelectedImage:profileImage];
    
    // customize the tint colors
    [[UITabBar appearance] setTintColor:[UIColor goldBeeColor]];
}


- (void)loginToApp {
    [self.spinner stop];
    [self performSegueWithIdentifier:kLoginSegue sender:self];
}




@end
