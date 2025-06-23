//
//  ViewController.h
//  Bees Chest
//
//  Created by Billy Irwin on 12/29/13.
//  Copyright (c) 2013 Arbrr. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "BATypeAheadViewController.h"
#import "Contact.h"
#import <Parse/Parse.h>
#import "BaseViewController.h"
#import "BASpinner.h"

@interface ViewController : BaseViewController

@property (nonatomic, strong) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (weak, nonatomic) IBOutlet UIProgressView *progressView;
@property (weak, nonatomic) IBOutlet UIButton *loginBtn;
@property (strong, nonatomic) NSMutableDictionary *tmpUserDict;
@property (strong, nonatomic) BASpinner *spinner;
@property (strong, nonatomic) UIView *dimView;

- (void)setProgress:(float)value;
- (IBAction)loginButtonTouchHandler:(id)sender;

@end
