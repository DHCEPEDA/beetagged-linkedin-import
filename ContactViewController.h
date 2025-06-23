//
//  ContactViewController.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Contact.h"
#import <SDWebImage/UIImageView+WebCache.h>
#import <QuartzCore/QuartzCore.h>
#import "TagCell.h"
#import "BATypeAheadViewController.h"
#import "FBManager.h"
#import "ContactTransition.h"
#import "TagCell.h"
#import "UIColor+Bee.h"

@interface ContactViewController : UIViewController <UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout, TagCellDelegate, UITableViewDataSource, UITableViewDelegate, UITextViewDelegate, UITextFieldDelegate>

@property (nonatomic, strong) Contact *contact;
@property (nonatomic, strong) BATypeAheadViewController *typeAheadViewController;
@property (nonatomic, strong) BATypeAheadView *typeAheadView;
@property (strong, nonatomic) NSMutableArray *contactTags;
@property (strong, nonatomic) NSMutableDictionary *expandedRows;
@property (nonatomic) BOOL isCurrentUser;

@property (nonatomic, strong) NSString *tmpLocation;

@property (weak, nonatomic) IBOutlet UITableView *profileTableView;
@property (strong, nonatomic) IBOutlet UICollectionView *tagsCollectionView;


- (void)renderContact:(Contact*)c;
@end
