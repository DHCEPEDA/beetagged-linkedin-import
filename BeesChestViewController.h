//
//  BeesChestViewController.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "BATypeAheadView.h"
#import "BATypeAheadViewController.h"
#import <SDWebImage/UIImageView+WebCache.h>

@interface BeesChestViewController : UIViewController <BATypeAheadDelegate>
@property (strong, nonatomic) NSMutableArray *players;
@property (strong, nonatomic) NSString *tag;
@property (weak, nonatomic) IBOutlet UIButton *stopBtn;
@property (weak, nonatomic) IBOutlet UIControl *p1View;
@property (weak, nonatomic) IBOutlet UIControl *p2View;
@property (weak, nonatomic) IBOutlet UIButton *playGameBtn;
@property (strong, nonatomic) BATypeAheadView *typeAheadView;
@property (weak, nonatomic) IBOutlet UIImageView *p1ImageView;
@property (strong, nonatomic) BATypeAheadViewController *typeAheadViewController;
@property (weak, nonatomic) IBOutlet UIImageView *p2ImageView;
@property (weak, nonatomic) IBOutlet UILabel *gameLabel;
@property (weak, nonatomic) IBOutlet UILabel *p1NameLabel;
@property (weak, nonatomic) IBOutlet UILabel *p2NameLabel;
@property (strong, nonatomic) NSString *tagName;
@property (weak, nonatomic) IBOutlet UILabel *preferLabel;
@property (weak, nonatomic) IBOutlet UILabel *tagMoreLabel;

@property (weak, nonatomic) Contact *p1;
@property (weak, nonatomic) Contact *p2;

- (void)playGameWithTag:(NSString*)tag;
- (IBAction)stopGame:(id)sender;
- (IBAction)choosePlayer1:(id)sender;
- (IBAction)choosePlayer2:(id)sender;
- (IBAction)playGame:(id)sender;
- (IBAction)chooseP1:(id)sender;
- (IBAction)chooseP2:(id)sender;



@end
